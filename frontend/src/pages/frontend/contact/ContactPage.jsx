import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    Clock3,
    ExternalLink,
    LoaderCircle,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Send,
} from "lucide-react";

import api from "../../../api/axios";
import ContactEditorModal from "./ContactEditorModal";

const EMPTY_FORM = {
    name: "",
    company: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
};

const ContactPage = () => {
    const [contactPage, setContactPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [editorSection, setEditorSection] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editorError, setEditorError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isAdmin = getIsAdmin();

    const fetchContactPage = async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get("/contact-page");

            if (response.data?.active === false) {
                setContactPage(null);
                return;
            }

            setContactPage(
                response.data?.contact_page || null
            );
        } catch (error) {
            console.error(
                "Contact page error:",
                error
            );

            setPageError(
                error.response?.data?.message ||
                    "Unable to load the contact page."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContactPage();
    }, []);

    const handleSectionSave = async (
        updatedSection
    ) => {
        if (!updatedSection?.key || saving) {
            return;
        }

        try {
            setSaving(true);
            setEditorError("");

            const response = await api.put(
                `/admin/contact-page-settings/${updatedSection.key}`,
                updatedSection
            );

            setContactPage(
                response.data?.contact_page ||
                    contactPage
            );

            setEditorSection(null);
            showSuccess(
                response.data?.message ||
                    "Contact page updated successfully."
            );
        } catch (error) {
            console.error(
                "Contact page save error:",
                error
            );

            setEditorError(
                getValidationError(error)
            );
        } finally {
            setSaving(false);
        }
    };

    const handleHeroImageUpload = async (
        image
    ) => {
        if (!image || saving) {
            return;
        }

        const formData = new FormData();
        formData.append("image", image);

        try {
            setSaving(true);
            setEditorError("");

            const response = await api.post(
                "/admin/contact-page-settings/hero-image",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

            setContactPage(
                response.data?.contact_page ||
                    contactPage
            );

            setEditorSection(
                response.data?.contact_page?.hero ||
                    null
            );

            showSuccess(
                response.data?.message ||
                    "Hero image updated successfully."
            );
        } catch (error) {
            console.error(
                "Hero image upload error:",
                error
            );

            setEditorError(
                getValidationError(error)
            );
        } finally {
            setSaving(false);
        }
    };

    const handleHeroImageRemove = async () => {
        if (saving) {
            return;
        }

        try {
            setSaving(true);
            setEditorError("");

            const response = await api.delete(
                "/admin/contact-page-settings/hero-image"
            );

            setContactPage(
                response.data?.contact_page ||
                    contactPage
            );

            setEditorSection(
                response.data?.contact_page?.hero ||
                    null
            );

            showSuccess(
                response.data?.message ||
                    "Hero image removed successfully."
            );
        } catch (error) {
            setEditorError(
                getValidationError(error)
            );
        } finally {
            setSaving(false);
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);

        window.setTimeout(() => {
            setSuccessMessage("");
        }, 3500);
    };

    if (loading) {
        return <ContactPageLoader />;
    }

    if (pageError) {
        return (
            <ContactPageError
                message={pageError}
                onRetry={fetchContactPage}
            />
        );
    }

    if (!contactPage) {
        return null;
    }

    const hero = contactPage.hero || {};
    const contactInformation =
        contactPage.contact_information || {};
    const formContent =
        contactPage.form_content || {};
    const mapContent =
        contactPage.map_content || {};

    return (
        <>
            <main className="w-full bg-white">
                <ContactBreadcrumb />

                <ContactHero
                    hero={hero}
                    isAdmin={isAdmin}
                    onEdit={() =>
                        setEditorSection(hero)
                    }
                />

                <div className="relative z-20 mx-auto -mt-[72px] max-w-[1500px] px-5 pb-[84px]">
                    <div className="grid overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
                        <ContactInformation
                            content={
                                contactInformation
                            }
                            isAdmin={isAdmin}
                            onEdit={() =>
                                setEditorSection(
                                    contactInformation
                                )
                            }
                        />

                        <ContactForm
                            content={formContent}
                            isAdmin={isAdmin}
                            onEdit={() =>
                                setEditorSection(
                                    formContent
                                )
                            }
                        />
                    </div>
                </div>

                <MapSection
                    content={mapContent}
                    isAdmin={isAdmin}
                    onEdit={() =>
                        setEditorSection(mapContent)
                    }
                />
            </main>

            {successMessage && (
                <SuccessToast
                    message={successMessage}
                />
            )}

            <ContactEditorModal
                open={Boolean(editorSection)}
                section={editorSection}
                saving={saving}
                error={editorError}
                onClose={() => {
                    if (!saving) {
                        setEditorSection(null);
                        setEditorError("");
                    }
                }}
                onSave={handleSectionSave}
                onHeroImageUpload={
                    handleHeroImageUpload
                }
                onHeroImageRemove={
                    handleHeroImageRemove
                }
            />
        </>
    );
};

const ContactBreadcrumb = () => {
    return (
        <div className="mx-auto max-w-[1500px] px-5 pb-[26px] pt-[38px]">
            <div className="flex items-center gap-[12px] text-[14px]">
                <Link
                    to="/"
                    className="text-[#777] transition-colors hover:text-[#2065D1]"
                >
                    Home
                </Link>

                <ChevronRight
                    size={15}
                    className="text-[#a3a3a3]"
                />

                <span className="font-medium text-[#171717]">
                    Contact Us
                </span>
            </div>
        </div>
    );
};

const ContactHero = ({
    hero,
    isAdmin,
    onEdit,
}) => {
    const backgroundImage =
        hero.background_image_url;

    const overlayOpacity = Math.min(
        100,
        Math.max(
            0,
            Number(hero.overlay_opacity ?? 65)
        )
    );

    return (
        <section
            className="relative min-h-[430px] overflow-hidden bg-[#071327]"
            style={{
                backgroundImage: backgroundImage
                    ? `url("${backgroundImage}")`
                    : "linear-gradient(135deg, #08162d 0%, #102b52 100%)",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
            }}
        >
            <div
                className="absolute inset-0 bg-[#020b1d]"
                style={{
                    opacity: overlayOpacity / 100,
                }}
            />

            {isAdmin && (
                <AdminEditButton
                    onClick={onEdit}
                    className="right-5 top-5"
                    label="Edit contact hero"
                />
            )}

            <div className="relative z-10 mx-auto flex min-h-[430px] max-w-[1500px] items-center justify-center px-5 pb-[48px] text-center">
                <div className="max-w-[790px]">
                    <h1 className="text-[38px] font-bold leading-[1.15] tracking-[-1px] text-white sm:text-[48px]">
                        {hero.title ||
                            "Contact Us"}
                    </h1>

                    {hero.subtitle && (
                        <p className="mx-auto mt-[18px] max-w-[760px] text-[16px] leading-[1.75] text-white/85 sm:text-[18px]">
                            {hero.subtitle}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

const ContactInformation = ({
    content,
    isAdmin,
    onEdit,
}) => {
    return (
        <section className="relative bg-[#f7f8fa] px-[26px] py-[38px] sm:px-[44px] sm:py-[48px] lg:px-[54px]">
            {isAdmin && (
                <AdminEditButton
                    onClick={onEdit}
                    className="right-5 top-5"
                    label="Edit contact information"
                />
            )}

            <h2 className="text-[26px] font-bold tracking-[-0.5px] text-[#111]">
                {content.title ||
                    "Get in Touch"}
            </h2>

            {content.description && (
                <p className="mt-[14px] max-w-[520px] text-[14px] leading-[1.75] text-[#6f6f6f]">
                    {content.description}
                </p>
            )}

            <div className="mt-[34px] space-y-[26px]">
                <ContactDetail
                    icon={MapPin}
                    title={
                        content.address_title ||
                        "Head Office"
                    }
                    value={content.address}
                />

                <ContactDetail
                    icon={Mail}
                    title={
                        content.email_title ||
                        "Email Us"
                    }
                    value={content.email}
                    href={
                        content.email
                            ? `mailto:${content.email}`
                            : null
                    }
                />

                <ContactDetail
                    icon={Phone}
                    title={
                        content.phone_title ||
                        "Call Us"
                    }
                    value={content.phone}
                    href={
                        content.phone
                            ? `tel:${content.phone.replace(
                                  /[^\d+]/g,
                                  ""
                              )}`
                            : null
                    }
                />

                <ContactDetail
                    icon={Clock3}
                    title={
                        content.hours_title ||
                        "Support Hours"
                    }
                    value={content.hours}
                />
            </div>
        </section>
    );
};

const ContactDetail = ({
    icon: Icon,
    title,
    value,
    href,
}) => {
    return (
        <div className="group flex items-start gap-[18px]">
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#2468d8] text-white shadow-[0_8px_20px_rgba(36,104,216,0.22)]">
                <Icon
                    size={21}
                    strokeWidth={1.8}
                />
            </div>

            <div className="min-w-0 pt-[1px]">
                <h3 className="text-[15px] font-semibold text-[#151515]">
                    {title}
                </h3>

                {href ? (
                    <a
                        href={href}
                        className="mt-[5px] block break-words text-[14px] leading-[1.6] text-[#737373] transition-colors group-hover:text-[#2065D1]"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="mt-[5px] text-[14px] leading-[1.6] text-[#737373]">
                        {value}
                    </p>
                )}
            </div>
        </div>
    );
};

const ContactForm = ({
    content,
    isAdmin,
    onEdit,
}) => {
    const [form, setForm] =
        useState(EMPTY_FORM);
    const [submitting, setSubmitting] =
        useState(false);
    const [formError, setFormError] =
        useState("");
    const [formSuccess, setFormSuccess] =
        useState("");

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFormError("");
        setFormSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);
            setFormError("");
            setFormSuccess("");

            const response = await api.post(
                "/contact-messages",
                form
            );

            setFormSuccess(
                content.success_message ||
                    response.data?.message ||
                    "Your message has been sent successfully."
            );

            setForm(EMPTY_FORM);
        } catch (error) {
            console.error(
                "Contact form error:",
                error
            );

            setFormError(
                getValidationError(error)
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="relative bg-white px-[26px] py-[38px] sm:px-[44px] sm:py-[48px] lg:px-[54px]">
            {isAdmin && (
                <AdminEditButton
                    onClick={onEdit}
                    className="right-5 top-5"
                    label="Edit contact form"
                />
            )}

            <h2 className="text-[26px] font-bold tracking-[-0.5px] text-[#111]">
                {content.title ||
                    "Send us a message"}
            </h2>

            {content.description && (
                <p className="mt-[14px] text-[14px] leading-[1.75] text-[#6f6f6f]">
                    {content.description}
                </p>
            )}

            <form
                onSubmit={handleSubmit}
                className="mt-[30px]"
            >
                <div className="grid gap-x-[16px] gap-y-[19px] md:grid-cols-2">
                    <FormField
                        label={
                            content.name_label ||
                            "Name"
                        }
                        name="name"
                        value={form.name}
                        placeholder={
                            content.name_placeholder ||
                            "Your name"
                        }
                        onChange={updateField}
                        required
                    />

                    <FormField
                        label={
                            content.company_label ||
                            "Company"
                        }
                        name="company"
                        value={form.company}
                        placeholder={
                            content.company_placeholder ||
                            "Company"
                        }
                        onChange={updateField}
                    />

                    <FormField
                        label={
                            content.phone_label ||
                            "Phone"
                        }
                        name="phone"
                        value={form.phone}
                        placeholder={
                            content.phone_placeholder ||
                            "Phone"
                        }
                        onChange={updateField}
                    />

                    <FormField
                        label={
                            content.email_label ||
                            "Email"
                        }
                        name="email"
                        type="email"
                        value={form.email}
                        placeholder={
                            content.email_placeholder ||
                            "Email"
                        }
                        onChange={updateField}
                        required
                    />

                    <div className="md:col-span-2">
                        <FormField
                            label={
                                content.subject_label ||
                                "Subject"
                            }
                            name="subject"
                            value={form.subject}
                            placeholder={
                                content.subject_placeholder ||
                                "Subject"
                            }
                            onChange={updateField}
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-[7px] block text-[13px] font-medium text-[#151515]">
                            {content.message_label ||
                                "Message"}
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <textarea
                            name="message"
                            value={form.message}
                            placeholder={
                                content.message_placeholder ||
                                "How can we help?"
                            }
                            onChange={updateField}
                            required
                            rows={5}
                            className="min-h-[138px] w-full resize-y rounded-[8px] border border-[#dedede] bg-white px-[14px] py-[12px] text-[14px] text-[#222] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                        />
                    </div>
                </div>

                {formError && (
                    <div className="mt-[18px] rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                        {formError}
                    </div>
                )}

                {formSuccess && (
                    <div className="mt-[18px] rounded-[8px] border border-emerald-200 bg-emerald-50 px-[14px] py-[11px] text-[13px] text-emerald-700">
                        {formSuccess}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-[20px] flex h-[50px] w-full items-center justify-center gap-[9px] rounded-[8px] bg-[#2468d8] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(36,104,216,0.2)] transition hover:bg-[#1859bd] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? (
                        <LoaderCircle
                            size={18}
                            className="animate-spin"
                        />
                    ) : (
                        <Send size={17} />
                    )}

                    {submitting
                        ? "Sending..."
                        : content.button_text ||
                          "Send Message"}
                </button>
            </form>
        </section>
    );
};

const FormField = ({
    label,
    name,
    type = "text",
    value,
    placeholder,
    onChange,
    required = false,
}) => {
    return (
        <div>
            <label className="mb-[7px] block text-[13px] font-medium text-[#151515]">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                required={required}
                className="h-[45px] w-full rounded-[8px] border border-[#dedede] bg-white px-[14px] text-[14px] text-[#222] outline-none transition placeholder:text-[#999] focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
            />
        </div>
    );
};

const MapSection = ({
    content,
    isAdmin,
    onEdit,
}) => {
    return (
        <section className="bg-[#fbfbfc] py-[76px]">
            <div className="relative mx-auto max-w-[1500px] px-5">
                {isAdmin && (
                    <AdminEditButton
                        onClick={onEdit}
                        className="right-5 top-0"
                        label="Edit map section"
                    />
                )}

                <div className="flex flex-col gap-4 pr-[55px] sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-[27px] font-bold tracking-[-0.5px] text-[#111]">
                            {content.title ||
                                "Visit Our Store"}
                        </h2>

                        {content.description && (
                            <p className="mt-[9px] text-[14px] leading-[1.7] text-[#6f6f6f]">
                                {
                                    content.description
                                }
                            </p>
                        )}
                    </div>

                    {content.google_maps_url && (
                        <a
                            href={
                                content.google_maps_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex shrink-0 items-center gap-[7px] text-[14px] font-medium text-[#2065D1] hover:text-[#174fa7]"
                        >
                            {content.link_text ||
                                "Open in Google Maps"}

                            <ExternalLink
                                size={15}
                            />
                        </a>
                    )}
                </div>

                <div className="mt-[24px] overflow-hidden rounded-[12px] border border-[#e3e5e8] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                    {content.map_embed_url ? (
                        <iframe
                            src={
                                content.map_embed_url
                            }
                            title={
                                content.title ||
                                "Store location"
                            }
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                            className="h-[470px] w-full border-0"
                        />
                    ) : (
                        <div className="flex h-[360px] flex-col items-center justify-center bg-[#f4f6f8] px-5 text-center">
                            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[#2065D1] shadow-sm">
                                <MapPin size={25} />
                            </div>

                            <h3 className="mt-[16px] text-[16px] font-semibold text-[#222]">
                                Store map is not configured
                            </h3>

                            <p className="mt-[6px] max-w-[390px] text-[13px] leading-[1.6] text-[#777]">
                                Add a Google Maps embed URL
                                from the admin editor.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const AdminEditButton = ({
    onClick,
    className = "",
    label,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`absolute z-20 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#dfe5ee] bg-white text-[#2065D1] shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition hover:scale-105 hover:bg-[#f5f8ff] ${className}`}
        >
            <Pencil size={17} />
        </button>
    );
};

const ContactPageLoader = () => {
    return (
        <div className="flex min-h-[520px] items-center justify-center bg-white">
            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />
        </div>
    );
};

const ContactPageError = ({
    message,
    onRetry,
}) => {
    return (
        <div className="flex min-h-[520px] items-center justify-center px-5">
            <div className="text-center">
                <p className="text-[14px] text-red-600">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-[8px] bg-[#2065D1] px-5 py-2.5 text-[14px] font-medium text-white"
                >
                    Try again
                </button>
            </div>
        </div>
    );
};

const SuccessToast = ({ message }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[1500] max-w-[360px] rounded-[10px] border border-emerald-200 bg-white px-[18px] py-[14px] text-[13px] font-medium text-emerald-700 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
            {message}
        </div>
    );
};

const getIsAdmin = () => {
    try {
        const token = localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");

        if (!token || !storedUser) {
            return false;
        }

        const user = JSON.parse(storedUser);

        return (
            user?.role === "admin" ||
            user?.user_type === "admin" ||
            user?.is_admin === true ||
            user?.is_admin === 1
        );
    } catch {
        return false;
    }
};

const getValidationError = (error) => {
    const errors =
        error.response?.data?.errors || {};

    const firstError = Object.values(errors)
        .flat()
        .find(Boolean);

    return (
        firstError ||
        error.response?.data?.message ||
        "Something went wrong. Please try again."
    );
};

export default ContactPage;