import {
    ExternalLink,
    Mail,
    MapPin,
    Pencil,
    Phone,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";


import {
    Link,
} from "react-router-dom";

import FooterEditorModal from "./footer/FooterEditorModal";
import api from "../../api/axios";

const initialStoreInformation = {
    key: "store_information",
    type: "store",
    editor_title: "Store Information",
    store_name: "Storify",
    description:
        "Storify is a modern self-hosted eCommerce platform built with Next.js for online stores, retail POS businesses, and multi-vendor marketplaces.",
    contact_title: "Contact",
    phone: "+1 775 986 5200",
    email: "store@example.com",
    address:
        "Main Street, New York, 1000",
};

const initialFooterMenus = [
    {
        key: "products",
        type: "menu",
        title: "Products",
        links: [
            {
                id: "products-1",
                label: "Products",
                url: "/products",
            },
            {
                id: "products-2",
                label: "Categories",
                url: "/categories",
            },
            {
                id: "products-3",
                label: "Collections",
                url: "/collections",
            },
            {
                id: "products-4",
                label: "New Arrivals",
                url: "/products?sort=newest",
            },
        ],
    },
    {
        key: "help",
        type: "menu",
        title: "Help",
        links: [
            {
                id: "help-1",
                label: "Track Order",
                url: "/account/orders",
            },
            {
                id: "help-2",
                label: "FAQ",
                url: "/faq",
            },
            {
                id: "help-3",
                label: "Returns",
                url: "/returns",
            },
            {
                id: "help-4",
                label: "Contact",
                url: "/contact",
            },
        ],
    },
    {
        key: "company",
        type: "menu",
        title: "Company",
        links: [
            {
                id: "company-1",
                label: "Blog",
                url: "/blog",
            },
            {
                id: "company-2",
                label: "Become a Vendor",
                url: "/become-vendor",
            },
        ],
    },
    {
        key: "legal",
        type: "menu",
        title: "Legal",
        links: [
            {
                id: "legal-1",
                label: "Terms of Service",
                url: "/terms-of-service",
            },
            {
                id: "legal-2",
                label: "Privacy Policy",
                url: "/privacy-policy",
            },
        ],
    },
];

const initialCopyright = {
    key: "copyright",
    type: "copyright",
    editor_title: "Copyright",
    text:
        "© 2026 Storify. All rights reserved.",
};

const initialSocialLinks = {
    key: "social_links",
    type: "social",
    title: "Social Links",
    links: [
        {
            id: "social-1",
            label: "Facebook",
            shortLabel: "f",
            url: "https://facebook.com",
        },
        {
            id: "social-2",
            label: "Twitter",
            shortLabel: "𝕏",
            url: "https://twitter.com",
        },
        {
            id: "social-3",
            label: "Instagram",
            shortLabel: "◎",
            url: "https://instagram.com",
        },
        {
            id: "social-4",
            label: "YouTube",
            shortLabel: "▶",
            url: "https://youtube.com",
        },
        {
            id: "social-5",
            label: "LinkedIn",
            shortLabel: "in",
            url: "https://linkedin.com",
        },
        {
            id: "social-6",
            label: "TikTok",
            shortLabel: "♪",
            url: "https://tiktok.com",
        },
    ],
};

const getIsAdmin = () => {
    const token =
        localStorage.getItem("token");

    if (!token) {
        return false;
    }

    try {
        const user = JSON.parse(
            localStorage.getItem("user")
        );

        return user?.role === "admin";
    } catch {
        return false;
    }
};

const AdminEditButton = ({
    isAdmin,
    label,
    onClick,
}) => {
    if (!isAdmin) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            title={`Edit ${label}`}
            aria-label={`Edit ${label}`}
            className="absolute right-0 top-0 flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#d9e4fb] bg-white text-[#1769ff] shadow-[0_4px_12px_rgba(32,101,209,0.10)] transition hover:border-[#b8cff8] hover:bg-[#edf5ff]"
        >
            <Pencil
                size={14}
                strokeWidth={2}
            />
        </button>
    );
};

const FooterMenuLink = ({
    item,
}) => {
    const url =
        item.url?.trim() || "#";

    const isExternal =
        url.startsWith("http://") ||
        url.startsWith("https://");

    if (isExternal) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[5px] text-[15px] text-[#697281] transition hover:text-[#1769ff]"
            >
                {item.label}

                <ExternalLink
                    size={12}
                    className="opacity-0 transition group-hover:opacity-100"
                />
            </a>
        );
    }

    return (
        <Link
            to={url}
            className="text-[15px] text-[#697281] transition hover:text-[#1769ff]"
        >
            {item.label}
        </Link>
    );
};

const FrontendFooter = () => {
    const isAdmin = getIsAdmin();

    const [
        storeInformation,
        setStoreInformation,
    ] = useState(
        initialStoreInformation
    );

    const [
        footerMenus,
        setFooterMenus,
    ] = useState(
        initialFooterMenus
    );

    const [
        copyright,
        setCopyright,
    ] = useState(
        initialCopyright
    );

    const [
        socialLinks,
        setSocialLinks,
    ] = useState(
        initialSocialLinks
    );

    const [
        editorSection,
        setEditorSection,
    ] = useState(null);


    const [
    footerActive,
    setFooterActive,
] = useState(true);

const [
    footerLoading,
    setFooterLoading,
] = useState(true);

const [
    footerSaving,
    setFooterSaving,
] = useState(false);

const [
    footerMessage,
    setFooterMessage,
] = useState("");

const [
    footerError,
    setFooterError,
] = useState("");



useEffect(() => {
    let mounted = true;

    const fetchFooter = async () => {
        try {
            setFooterLoading(true);

            const response = await api.get(
                "/footer"
            );

            if (!mounted) {
                return;
            }

            const data =
                response.data || {};

            const savedFooter =
                data.footer;

            if (!savedFooter) {
                setFooterActive(true);
                return;
            }

            setFooterActive(
                data.active !== false
            );

            if (
                savedFooter.store_information
            ) {
                setStoreInformation({
                    ...initialStoreInformation,
                    ...savedFooter
                        .store_information,
                });
            }

            if (
                Array.isArray(
                    savedFooter.menus
                ) &&
                savedFooter.menus.length >
                    0
            ) {
                setFooterMenus(
                    savedFooter.menus
                );
            }

            if (
                savedFooter.copyright
            ) {
                setCopyright({
                    ...initialCopyright,
                    ...savedFooter.copyright,
                });
            }

            if (
                savedFooter.social_links
            ) {
                setSocialLinks({
                    ...initialSocialLinks,
                    ...savedFooter
                        .social_links,
                });
            }
        } catch (error) {
            console.error(
                "Footer load error:",
                error
            );

            /*
             * API fail করলে static footer
             * দেখানো হবে।
             */
            if (mounted) {
                setFooterActive(true);
            }
        } finally {
            if (mounted) {
                setFooterLoading(false);
            }
        }
    };

    fetchFooter();

    return () => {
        mounted = false;
    };
}, []);




    const handleEdit = (
        sectionKey
    ) => {
        if (!isAdmin) {
            return;
        }

        if (
            sectionKey ===
            "store_information"
        ) {
            setEditorSection(
                storeInformation
            );
            return;
        }

        if (
            sectionKey ===
            "copyright"
        ) {
            setEditorSection(
                copyright
            );
            return;
        }

        if (
            sectionKey ===
            "social_links"
        ) {
            setEditorSection(
                socialLinks
            );
            return;
        }

        const menu =
            footerMenus.find(
                (item) =>
                    item.key ===
                    sectionKey
            );

        if (menu) {
            setEditorSection(menu);
        }
    };

    
    const handleApplyChanges = async (
    updatedSection
) => {
    if (
        !isAdmin ||
        footerSaving ||
        !updatedSection?.key
    ) {
        return;
    }

    try {
        setFooterSaving(true);
        setFooterMessage("");
        setFooterError("");

        const response = await api.put(
            `/admin/footer-settings/${updatedSection.key}`,
            updatedSection
        );

        const savedFooter =
            response.data?.footer;

        if (
            savedFooter
                ?.store_information
        ) {
            setStoreInformation({
                ...initialStoreInformation,
                ...savedFooter
                    .store_information,
            });
        }

        if (
            Array.isArray(
                savedFooter?.menus
            )
        ) {
            setFooterMenus(
                savedFooter.menus
            );
        }

        if (
            savedFooter?.copyright
        ) {
            setCopyright({
                ...initialCopyright,
                ...savedFooter.copyright,
            });
        }

        if (
            savedFooter?.social_links
        ) {
            setSocialLinks({
                ...initialSocialLinks,
                ...savedFooter
                    .social_links,
            });
        }

        setEditorSection(null);

        setFooterMessage(
            response.data?.message ||
                "Footer section updated successfully."
        );
    } catch (error) {
        console.error(
            "Footer save error:",
            error
        );

        if (
            error.response?.status === 422
        ) {
            const errors =
                error.response?.data
                    ?.errors || {};

            const firstError =
                Object.values(errors)
                    .flat()
                    .find(Boolean);

            setFooterError(
                firstError ||
                    error.response?.data
                        ?.message ||
                    "Please check the footer information."
            );
        } else {
            setFooterError(
                error.response?.data
                    ?.message ||
                    "Unable to update the footer section."
            );
        }
    } finally {
        setFooterSaving(false);
    }
};



    const phoneHref =
        storeInformation.phone
            .replace(/[^\d+]/g, "");


            if (footerLoading) {
    return (
        <div className="border-t border-[#e2e5e9] bg-[#f7f8fa] py-[55px]">
            <div className="mx-auto flex max-w-[1490px] justify-center px-5 lg:px-8">
                <div className="h-[24px] w-[24px] animate-spin rounded-full border-[2px] border-[#d8dee8] border-t-[#2065D1]" />
            </div>
        </div>
    );
}

if (!footerActive) {
    return null;
}




    return (
        <>

        {isAdmin && footerMessage && (
    <div className="mx-auto max-w-[1490px] px-5 pt-5 lg:px-8">
        <div className="rounded-[10px] border border-[#bde6d4] bg-[#effbf5] px-[14px] py-[11px] text-[12px] font-medium text-[#16855d]">
            {footerMessage}
        </div>
    </div>
)}

{isAdmin && footerError && (
    <div className="mx-auto max-w-[1490px] px-5 pt-5 lg:px-8">
        <div className="rounded-[10px] border border-[#ffc8cc] bg-[#fff1f2] px-[14px] py-[11px] text-[12px] font-medium text-[#dc3545]">
            {footerError}
        </div>
    </div>
)}


            <footer className="border-t border-[#e2e5e9] bg-[#f7f8fa] text-[#18202d]">
                <div className="mx-auto max-w-[1490px] px-5 pb-[48px] pt-[58px] lg:px-8 lg:pb-[54px] lg:pt-[62px]">
                    <div className="grid grid-cols-1 gap-[44px] md:grid-cols-2 lg:grid-cols-[1.7fr_repeat(4,1fr)] lg:gap-[55px]">
                        <div className="relative pr-[42px]">
                            <AdminEditButton
                                isAdmin={
                                    isAdmin
                                }
                                label="store information"
                                onClick={() =>
                                    handleEdit(
                                        "store_information"
                                    )
                                }
                            />

                            <Link
                                to="/"
                                className="inline-flex items-center gap-[9px]"
                            >
                                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#26d6d1] via-[#7c56f5] to-[#ff54bd] p-[2px] shadow-[0_5px_14px_rgba(91,88,220,0.22)]">
                                    <span className="flex h-full w-full items-center justify-center rounded-[8px] bg-white text-[20px] font-extrabold text-[#1769ff]">
                                        S
                                    </span>
                                </span>

                                <span className="text-[25px] font-extrabold tracking-[-1px] text-[#1769ff]">
                                    {
                                        storeInformation.store_name
                                    }
                                </span>
                            </Link>

                            <p className="mt-[17px] max-w-[330px] text-[15px] leading-[1.55] text-[#697281]">
                                {
                                    storeInformation.description
                                }
                            </p>

                            <h3 className="mt-[18px] text-[15px] font-semibold text-[#202734]">
                                {
                                    storeInformation.contact_title
                                }
                            </h3>

                            <div className="mt-[11px] space-y-[10px]">
                                {storeInformation.phone && (
                                    <a
                                        href={`tel:${phoneHref}`}
                                        className="flex items-center gap-[9px] text-[15px] text-[#697281] transition hover:text-[#1769ff]"
                                    >
                                        <Phone
                                            size={
                                                17
                                            }
                                            strokeWidth={
                                                1.8
                                            }
                                        />

                                        {
                                            storeInformation.phone
                                        }
                                    </a>
                                )}

                                {storeInformation.email && (
                                    <a
                                        href={`mailto:${storeInformation.email}`}
                                        className="flex items-center gap-[9px] text-[15px] text-[#697281] transition hover:text-[#1769ff]"
                                    >
                                        <Mail
                                            size={
                                                17
                                            }
                                            strokeWidth={
                                                1.8
                                            }
                                        />

                                        {
                                            storeInformation.email
                                        }
                                    </a>
                                )}

                                {storeInformation.address && (
                                    <div className="flex items-start gap-[9px] text-[15px] text-[#697281]">
                                        <MapPin
                                            size={
                                                17
                                            }
                                            strokeWidth={
                                                1.8
                                            }
                                            className="mt-[2px] shrink-0"
                                        />

                                        <span>
                                            {
                                                storeInformation.address
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {footerMenus.map(
                            (menu) => (
                                <div
                                    key={
                                        menu.key
                                    }
                                    className="relative pr-[38px]"
                                >
                                    <AdminEditButton
                                        isAdmin={
                                            isAdmin
                                        }
                                        label={
                                            menu.title
                                        }
                                        onClick={() =>
                                            handleEdit(
                                                menu.key
                                            )
                                        }
                                    />

                                    <h3 className="text-[17px] font-semibold text-[#202734]">
                                        {
                                            menu.title
                                        }
                                    </h3>

                                    <ul className="mt-[20px] space-y-[14px]">
                                        {menu.links
                                            .filter(
                                                (
                                                    item
                                                ) =>
                                                    item.label
                                            )
                                            .map(
                                                (
                                                    item,
                                                    index
                                                ) => (
                                                    <li
                                                        key={
                                                            item.id ||
                                                            `${menu.key}-${index}`
                                                        }
                                                        className="group"
                                                    >
                                                        <FooterMenuLink
                                                            item={
                                                                item
                                                            }
                                                        />
                                                    </li>
                                                )
                                            )}
                                    </ul>
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="border-t border-[#dde1e6]">
                    <div className="mx-auto flex max-w-[1490px] flex-col gap-[20px] px-5 py-[22px] md:flex-row md:items-center md:justify-between lg:px-8">
                        <div className="relative pr-[42px]">
                            <AdminEditButton
                                isAdmin={
                                    isAdmin
                                }
                                label="copyright"
                                onClick={() =>
                                    handleEdit(
                                        "copyright"
                                    )
                                }
                            />

                            <p className="text-[14px] text-[#697281]">
                                {
                                    copyright.text
                                }
                            </p>
                        </div>

                        <div className="relative flex items-center gap-[8px] pr-[42px]">
                            <AdminEditButton
                                isAdmin={
                                    isAdmin
                                }
                                label="social links"
                                onClick={() =>
                                    handleEdit(
                                        "social_links"
                                    )
                                }
                            />

                            {socialLinks.links
                                .filter(
                                    (social) =>
                                        social.label &&
                                        social.url
                                )
                                .map(
                                    (
                                        social,
                                        index
                                    ) => (
                                        <a
                                            key={
                                                social.id ||
                                                index
                                            }
                                            href={
                                                social.url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={
                                                social.label
                                            }
                                            aria-label={
                                                social.label
                                            }
                                            className="flex h-[34px] min-w-[34px] items-center justify-center rounded-full px-[7px] text-[14px] font-semibold text-[#717a89] transition hover:bg-white hover:text-[#1769ff] hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
                                        >
                                            {social.shortLabel ||
                                                social.label
                                                    .slice(
                                                        0,
                                                        2
                                                    )
                                                    .toLowerCase()}
                                        </a>
                                    )
                                )}
                        </div>
                    </div>
                </div>
            </footer>

            <FooterEditorModal
                open={
                    Boolean(
                        editorSection
                    )
                }
                section={
                    editorSection
                }
               


                onClose={() => {
    if (!footerSaving) {
        setEditorSection(null);
    }
}}


                onSave={
                    handleApplyChanges
                }
            />
        </>
    );
};

export default FrontendFooter;