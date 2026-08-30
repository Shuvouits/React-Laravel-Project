import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, Save } from "lucide-react";
import api from "../../../api/axios";

import PageBuilderItem from "../../../components/admin/onlineStore/home/PageBuilderItem";
import HeroSliderEditor from "../../../components/admin/onlineStore/home/HeroSliderEditor";
import FeaturedCategoriesEditor from "../../../components/admin/onlineStore/home/FeaturedCategoriesEditor";
import ProductsOnSaleEditor from "../../../components/admin/onlineStore/home/ProductsOnSaleEditor";
import PromotionsOffersEditor from "../../../components/admin/onlineStore/home/PromotionsOffersEditor";
import FeaturedProductsEditor from "../../../components/admin/onlineStore/home/FeaturedProductsEditor";
import TopVendorsEditor from "../../../components/admin/onlineStore/home/TopVendorsEditor";
import TopArticlesEditor from "../../../components/admin/onlineStore/home/TopArticlesEditor";

import BecomeVendorEditor from "../../../components/admin/onlineStore/home/BecomeVendorEditor";
import InstagramGalleryEditor from "../../../components/admin/onlineStore/home/InstagramGalleryEditor";

import {

  getFeaturedCategoriesSettings,
  getProductsOnSaleSettings,
  getPromotionsSettings,
  getFeaturedProductsSettings,
  getTopVendorsSettings,
  getBecomeVendorSettings,
  sectionDescriptions,
  getTopArticlesSettings,
  getInstagramGallerySettings

} from "../../../components/admin/onlineStore/home/homeSectionConfig";

const AdminHomePage = () => {
  const [activeEditor, setActiveEditor] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionError, setSectionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [togglingSection, setTogglingSection] = useState(null);
  const [saving, setSaving] = useState(false);

  const [featuredDraft, setFeaturedDraft] = useState({
    title: "Featured Categories",
    category_source: "featured",
    max_categories: 8,
  });

  const [productsOnSaleDraft, setProductsOnSaleDraft] = useState({
    title: "Product On Sale",
    subtitle: "",
    product_source: "on_sale",
    max_products: 8,
    desktop_cards_per_row: 4,
  });

  const [promotionsDraft, setPromotionsDraft] = useState({
    title: "Promotions & Offers",
    cards: [],
  });

  const [featuredProductsDraft, setFeaturedProductsDraft] = useState({
    title: "",
    product_source: "all_products",
    product_ids: [],
  });

  const [topVendorsDraft, setTopVendorsDraft] = useState({
    title: "Top Vendors",
    max_vendors: 8,
  });


  const [
    topArticlesDraft,
    setTopArticlesDraft,
  ] = useState({
    title: "Top Articles",
    limit: 9,
    desktop_columns: 4,
  });

  const [
    instagramGalleryDraft,
    setInstagramGalleryDraft,
  ] = useState({
    title: "From Instagram",
    limit: 10,
    desktop_columns: 5,
    images: [],
  });



  const [becomeVendorDraft, setBecomeVendorDraft] = useState({
    title: "Start Selling With Us Today",
    subtitle:
      "Join our marketplace, manage products easily, accept secure payments, and grow your business faster.",
    button_label: "Become a Vendor",
    button_link: "/become-vendor",
    image: "",
    image_url: "",
    saved_image_url: "",
    image_alt: "Start selling products as a vendor",
    uploading: false,
  });

  const [promotionAiTarget, setPromotionAiTarget] = useState(null);

  // Load homepage sections.
  const fetchSections = async () => {
    try {
      setSectionsLoading(true);
      setSectionError("");

      const response = await api.get("/admin/home-sections");
      const apiSections = response.data?.sections || [];

      const formattedSections = [...apiSections]
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((section) => ({
          ...section,
          is_active:
            section.is_active === true ||
            section.is_active === 1 ||
            section.is_active === "1",
          settings: section.settings || {},
          description: sectionDescriptions[section.section_key] || "",
        }));

      setSections(formattedSections);
    } catch (error) {
      console.error("Home sections error:", error);
      setSectionError(error.response?.data?.message || "Unable to load homepage sections.");
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Toggle section visibility.
  const handleToggleSection = async (section) => {
    if (togglingSection) return;

    try {
      setTogglingSection(section.section_key);
      setSectionError("");
      setSuccessMessage("");

      const response = await api.post(`/admin/home-sections/${section.section_key}/toggle`);
      const updatedSection = response.data?.section;

      setSections((previous) =>
        previous.map((item) => {
          if (item.section_key !== section.section_key) return item;

          return {
            ...item,
            ...updatedSection,
            is_active:
              updatedSection?.is_active === true ||
              updatedSection?.is_active === 1 ||
              updatedSection?.is_active === "1",
            description: item.description,
          };
        })
      );
    } catch (error) {
      console.error("Toggle section error:", error);
      setSectionError(error.response?.data?.message || "Unable to update section visibility.");
    } finally {
      setTogglingSection(null);
    }
  };

  // Open or close a section editor.
  const handleEditSection = (section) => {
    setSuccessMessage("");
    setSectionError("");

    if (section.section_key === "hero") {
      setActiveEditor("hero");
      return;
    }

    if (section.section_key === "featured_categories") {
      if (activeEditor === "featured_categories") {
        setActiveEditor(null);
        return;
      }

      setFeaturedDraft(getFeaturedCategoriesSettings(section));
      setActiveEditor("featured_categories");
      return;
    }

    if (section.section_key === "products_on_sale") {
      if (activeEditor === "products_on_sale") {
        setActiveEditor(null);
        return;
      }

      setProductsOnSaleDraft(getProductsOnSaleSettings(section));
      setActiveEditor("products_on_sale");
      return;
    }

    if (section.section_key === "promotions") {
      if (activeEditor === "promotions") {
        setActiveEditor(null);
        return;
      }

      setPromotionsDraft(getPromotionsSettings(section));
      setActiveEditor("promotions");
      return;
    }

    if (section.section_key === "featured_products") {
      if (activeEditor === "featured_products") {
        setActiveEditor(null);
        return;
      }

      setFeaturedProductsDraft(getFeaturedProductsSettings(section));
      setActiveEditor("featured_products");
      return;
    }

    if (section.section_key === "top_vendors") {
      if (activeEditor === "top_vendors") {
        setActiveEditor(null);
        return;
      }

      setTopVendorsDraft(getTopVendorsSettings(section));
      setActiveEditor("top_vendors");
      return;
    }


    if (section.section_key === "become_a_vendor") {
      if (activeEditor === "become_a_vendor") {
        setActiveEditor(null);
        return;
      }

      setBecomeVendorDraft(
        getBecomeVendorSettings(section)
      );

      setActiveEditor("become_a_vendor");
      return;
    }



    if (
      section.section_key ===
      "top_articles"
    ) {
      if (
        activeEditor ===
        "top_articles"
      ) {
        setActiveEditor(null);
        return;
      }

      setTopArticlesDraft(
        getTopArticlesSettings(
          section
        )
      );

      setActiveEditor(
        "top_articles"
      );

      return;
    }



    if (section.section_key === "from_instagram") {
      if (activeEditor === "from_instagram") {
        setActiveEditor(null);
        return;
      }

      setInstagramGalleryDraft(
        getInstagramGallerySettings(section)
      );

      setActiveEditor("from_instagram");
      return;
    }


    console.log(`Editor not added yet: ${section.section_key}`);
  };

  // Draft change handlers.
  const handleFeaturedChange = (field, value) => {
    setFeaturedDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleProductsOnSaleChange = (field, value) => {
    setProductsOnSaleDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handlePromotionsChange = (field, value) => {
    setPromotionsDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleFeaturedProductsChange = (field, value) => {
    setFeaturedProductsDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleTopVendorsChange = (field, value) => {
    setTopVendorsDraft((previous) => ({ ...previous, [field]: value }));
  };


  const handleTopArticlesChange = (
    field,
    value
  ) => {
    setTopArticlesDraft(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    setSectionError("");
    setSuccessMessage("");
  };


  const handleInstagramGalleryChange = (
    field,
    value
  ) => {
    setInstagramGalleryDraft(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    setSectionError("");
    setSuccessMessage("");
  };




  const handleBecomeVendorChange = (
    field,
    value
  ) => {
    setBecomeVendorDraft((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSectionError("");
    setSuccessMessage("");
  };

  // Upload promotion image.
  const handlePromotionImageSelect = async (index, file) => {
    if (!file) return;

    setSectionError("");
    setSuccessMessage("");

    const temporaryPreview = URL.createObjectURL(file);

    setPromotionsDraft((previous) => {
      const cards = [...(previous.cards || [])];
      cards[index] = { ...(cards[index] || {}), image_url: temporaryPreview, uploading: true };

      return { ...previous, cards };
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        `/admin/home-sections/promotions/cards/${index}/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const savedCard = response.data?.card || {};
      const savedImageUrl = response.data?.image_url || savedCard?.image_url || "";

      setPromotionsDraft((previous) => {
        const cards = [...(previous.cards || [])];

        cards[index] = {
          ...(cards[index] || {}),
          ...savedCard,
          image_url: savedImageUrl,
          saved_image_url: savedImageUrl,
          image_file: null,
          temporary_preview: false,
          uploading: false,
        };

        return { ...previous, cards };
      });

      setSectionError("");
      setSuccessMessage(response.data?.message || "Promotion image uploaded successfully.");
    } catch (error) {
      console.error("Promotion image upload error:", error);

      setSectionError(
        error.response?.data?.message ||
        error.response?.data?.errors?.image?.[0] ||
        "Unable to upload promotion image."
      );

      setPromotionsDraft((previous) => {
        const cards = [...(previous.cards || [])];

        cards[index] = {
          ...(cards[index] || {}),
          uploading: false,
          image_url: cards[index]?.saved_image_url || "",
        };

        return { ...previous, cards };
      });
    } finally {
      URL.revokeObjectURL(temporaryPreview);
    }
  };


  const handleBecomeVendorImageSelect = async (
    file
  ) => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSectionError(
        "Please select a JPG, PNG or WebP image."
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSectionError(
        "Image size cannot be greater than 5MB."
      );

      return;
    }

    setSectionError("");
    setSuccessMessage("");

    const temporaryPreview =
      URL.createObjectURL(file);

    setBecomeVendorDraft((previous) => ({
      ...previous,
      image_url: temporaryPreview,
      uploading: true,
    }));

    try {
      const formData = new FormData();

      formData.append(
        "image",
        file
      );

      const response = await api.post(
        "/admin/home-sections/become-a-vendor/image",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      const imageUrl =
        response.data?.image_url || "";

      const imagePath =
        response.data?.image || "";

      setBecomeVendorDraft((previous) => ({
        ...previous,
        image: imagePath,
        image_url: imageUrl,
        saved_image_url: imageUrl,
        uploading: false,
      }));

      if (response.data?.section) {
        updateLocalSection(
          "become_a_vendor",
          response.data.section
        );
      }

      setSuccessMessage(
        response.data?.message ||
        "Become a Vendor image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Become a Vendor image upload error:",
        error
      );

      const imageError =
        error.response?.data?.errors
          ?.image?.[0];

      setSectionError(
        imageError ||
        error.response?.data?.message ||
        "Unable to upload the image."
      );

      setBecomeVendorDraft((previous) => ({
        ...previous,
        image_url:
          previous.saved_image_url || "",
        uploading: false,
      }));
    } finally {
      URL.revokeObjectURL(
        temporaryPreview
      );
    }
  };

  // Open Promotion AI Studio.
  const handlePromotionAiOpen = (index) => {
    setPromotionAiTarget(index);
    console.log("Promotion AI Studio card:", index);
  };

  // Apply AI generated promotion image.
  const handlePromotionAiImageUpdated = (imageUrl) => {
    if (promotionAiTarget === null || !imageUrl) return;

    setPromotionsDraft((previous) => {
      const cards = [...previous.cards];

      cards[promotionAiTarget] = {
        ...cards[promotionAiTarget],
        image_url: imageUrl,
        image_file: null,
        temporary_preview: false,
      };

      return { ...previous, cards };
    });

    setPromotionAiTarget(null);
  };

  // Update a saved section without refetching all sections.
  const updateLocalSection = (sectionKey, updatedSection) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.section_key !== sectionKey) return section;

        return {
          ...section,
          ...updatedSection,
          settings: updatedSection?.settings || section.settings || {},
          description: section.description,
        };
      })
    );
  };

  // Save Featured Categories.
  const saveFeaturedCategories = async () => {
    if (!featuredDraft.title.trim()) {
      setSectionError("Section title is required.");
      return;
    }

    const maxCategories = Number(featuredDraft.max_categories);

    if (maxCategories < 1 || maxCategories > 20) {
      setSectionError("Max categories must be between 1 and 20.");
      return;
    }

    const response = await api.post("/admin/home-sections/featured_categories/update", {
      title: featuredDraft.title.trim(),
      settings: {
        category_source: featuredDraft.category_source,
        max_categories: maxCategories,
      },
    });

    updateLocalSection("featured_categories", response.data?.section);
    setFeaturedDraft(getFeaturedCategoriesSettings(response.data?.section));
    setSectionError("");
    setSuccessMessage(response.data?.message || "Featured Categories settings saved successfully.");
  };

  // Save Products on Sale.
  const saveProductsOnSale = async () => {
    if (!productsOnSaleDraft.title.trim()) {
      setSectionError("Section title is required.");
      return;
    }

    const maxProducts = Number(productsOnSaleDraft.max_products);
    const desktopCards = Number(productsOnSaleDraft.desktop_cards_per_row);

    if (maxProducts < 1 || maxProducts > 24) {
      setSectionError("Max products must be between 1 and 24.");
      return;
    }

    if (desktopCards < 2 || desktopCards > 6) {
      setSectionError("Desktop cards per row must be between 2 and 6.");
      return;
    }

    const response = await api.post("/admin/home-sections/products_on_sale/update", {
      title: productsOnSaleDraft.title.trim(),
      settings: {
        subtitle: productsOnSaleDraft.subtitle.trim(),
        product_source: productsOnSaleDraft.product_source,
        max_products: maxProducts,
        desktop_cards_per_row: desktopCards,
      },
    });

    updateLocalSection("products_on_sale", response.data?.section);
    setProductsOnSaleDraft(getProductsOnSaleSettings(response.data?.section));
    setSectionError("");
    setSuccessMessage(response.data?.message || "Products on Sale settings saved successfully.");
  };

  // Save Promotions & Offers.
  const savePromotions = async () => {
    if (!promotionsDraft.title.trim()) {
      setSectionError("Section title is required.");
      return;
    }

    const cards = Array.isArray(promotionsDraft.cards) ? promotionsDraft.cards : [];

    const formattedCards = cards.map((card) => ({
      layout: card.layout || "",
      image_url:
        card.saved_image_url ||
        (card.image_url?.startsWith("blob:") ? "" : card.image_url || ""),
      image_alt: card.image_alt || "",
      link: card.link || "/products",
    }));

    const response = await api.post("/admin/home-sections/promotions/update", {
      title: promotionsDraft.title.trim(),
      settings: { cards: formattedCards },
    });

    updateLocalSection("promotions", response.data?.section);
    setPromotionsDraft(getPromotionsSettings(response.data?.section));
    setSectionError("");
    setSuccessMessage(response.data?.message || "Promotions & Offers saved successfully.");
  };

  // Save Featured Products.
  const saveFeaturedProducts = async () => {
    const allowedSources = ["all_products", "featured", "latest", "on_sale", "hand_picked"];

    if (!allowedSources.includes(featuredProductsDraft.product_source)) {
      setSectionError("Please select a valid product source.");
      return;
    }

    if (
      featuredProductsDraft.product_source === "hand_picked" &&
      (!Array.isArray(featuredProductsDraft.product_ids) || featuredProductsDraft.product_ids.length === 0)
    ) {
      setSectionError("Select at least one product for the hand-picked source.");
      return;
    }

    const response = await api.post("/admin/home-sections/featured_products/update", {
      title: featuredProductsDraft.title?.trim() || "",
      settings: {
        product_source: featuredProductsDraft.product_source,
        product_ids:
          featuredProductsDraft.product_source === "hand_picked"
            ? featuredProductsDraft.product_ids.map(Number)
            : [],
      },
    });

    updateLocalSection("featured_products", response.data?.section);
    setFeaturedProductsDraft(getFeaturedProductsSettings(response.data?.section));
    setSectionError("");
    setSuccessMessage(response.data?.message || "Featured Products settings saved successfully.");
  };

  // Save Top Vendors.
  const saveTopVendors = async () => {
    if (!topVendorsDraft.title.trim()) {
      setSectionError("Section title is required.");
      return;
    }

    const maxVendors = Number(topVendorsDraft.max_vendors);

    if (maxVendors < 1 || maxVendors > 24) {
      setSectionError("Max vendors must be between 1 and 24.");
      return;
    }

    const response = await api.post("/admin/home-sections/top_vendors/update", {
      title: topVendorsDraft.title.trim(),
      settings: { max_vendors: maxVendors },
    });

    updateLocalSection("top_vendors", response.data?.section);
    setTopVendorsDraft(getTopVendorsSettings(response.data?.section));
    setSectionError("");
    setSuccessMessage(response.data?.message || "Top Vendors settings saved successfully.");
  };


  const saveTopArticles = async () => {
    const title =
      topArticlesDraft.title.trim();

    const limit = Number(
      topArticlesDraft.limit
    );

    const desktopColumns = Number(
      topArticlesDraft.desktop_columns
    );

    if (!title) {
      setSectionError(
        "Section title is required."
      );

      return;
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 24
    ) {
      setSectionError(
        "Article limit must be between 1 and 24."
      );

      return;
    }

    if (
      !Number.isInteger(
        desktopColumns
      ) ||
      desktopColumns < 2 ||
      desktopColumns > 4
    ) {
      setSectionError(
        "Desktop columns must be between 2 and 4."
      );

      return;
    }

    const response = await api.post(
      "/admin/home-sections/top_articles/update",
      {
        title,
        settings: {
          limit,
          desktop_columns:
            desktopColumns,
        },
      }
    );

    updateLocalSection(
      "top_articles",
      response.data?.section
    );

    setTopArticlesDraft(
      getTopArticlesSettings(
        response.data?.section
      )
    );

    setSectionError("");

    setSuccessMessage(
      response.data?.message ||
      "Top Articles settings saved successfully."
    );
  };



  const saveInstagramGallery = async () => {
    const title =
      instagramGalleryDraft.title.trim();

    const limit = Number(
      instagramGalleryDraft.limit
    );

    const desktopColumns = Number(
      instagramGalleryDraft.desktop_columns
    );

    const images = Array.isArray(
      instagramGalleryDraft.images
    )
      ? instagramGalleryDraft.images
      : [];

    if (!title) {
      setSectionError(
        "Section title is required."
      );

      return;
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 30
    ) {
      setSectionError(
        "Gallery limit must be between 1 and 30."
      );

      return;
    }

    if (
      !Number.isInteger(desktopColumns) ||
      desktopColumns < 3 ||
      desktopColumns > 6
    ) {
      setSectionError(
        "Desktop columns must be between 3 and 6."
      );

      return;
    }

    if (images.length === 0) {
      setSectionError(
        "Please add at least one gallery image."
      );

      return;
    }

    const missingImages = images.some(
      (item) =>
        !item.image &&
        !item.saved_image_url
    );

    if (missingImages) {
      setSectionError(
        "Please upload an image for every gallery item."
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "title",
      title
    );

    formData.append(
      "settings[limit]",
      String(limit)
    );

    formData.append(
      "settings[desktop_columns]",
      String(desktopColumns)
    );

    images.forEach((item, index) => {
      formData.append(
        `images[${index}][id]`,
        String(item.id || "")
      );

      formData.append(
        `images[${index}][image_alt]`,
        item.image_alt?.trim() || ""
      );

      formData.append(
        `images[${index}][link]`,
        item.link?.trim() || ""
      );

      formData.append(
        `images[${index}][is_active]`,
        item.is_active === false
          ? "0"
          : "1"
      );

      formData.append(
        `images[${index}][saved_image_url]`,
        item.saved_image_url || ""
      );

      formData.append(
    `images[${index}][saved_image_path]`,
    item.image_path || ""
);




      if (item.image instanceof File) {
        formData.append(
          `images[${index}][image]`,
          item.image
        );
      }
    });

    const response = await api.post(
      "/admin/home-sections/from_instagram/update",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    const updatedSection =
      response.data?.section;

    updateLocalSection(
      "from_instagram",
      updatedSection
    );

    setInstagramGalleryDraft(
      getInstagramGallerySettings(
        updatedSection
      )
    );

    setSectionError("");

    setSuccessMessage(
      response.data?.message ||
      "Instagram gallery saved successfully."
    );
  };



  const saveBecomeVendor = async () => {
    const title =
      becomeVendorDraft.title.trim();

    const subtitle =
      becomeVendorDraft.subtitle.trim();

    const buttonLabel =
      becomeVendorDraft.button_label.trim();

    const buttonLink =
      becomeVendorDraft.button_link.trim();

    const imageAlt =
      becomeVendorDraft.image_alt.trim();

    if (!title) {
      setSectionError(
        "Section title is required."
      );

      return;
    }

    if (!subtitle) {
      setSectionError(
        "Section subtitle is required."
      );

      return;
    }

    if (!buttonLabel) {
      setSectionError(
        "Button label is required."
      );

      return;
    }

    if (!buttonLink) {
      setSectionError(
        "Button link is required."
      );

      return;
    }

    if (!becomeVendorDraft.image_url) {
      setSectionError(
        "Please upload a section image."
      );

      return;
    }

    const response = await api.post(
      "/admin/home-sections/become_a_vendor/update",
      {
        settings: {
          title,
          subtitle,
          button_label: buttonLabel,
          button_link: buttonLink,

          image:
            becomeVendorDraft.image || "",

          image_url:
            becomeVendorDraft.saved_image_url ||
            becomeVendorDraft.image_url,

          image_alt:
            imageAlt ||
            "Start selling products as a vendor",
        },
      }
    );

    updateLocalSection(
      "become_a_vendor",
      response.data?.section
    );

    setBecomeVendorDraft(
      getBecomeVendorSettings(
        response.data?.section
      )
    );

    setSectionError("");

    setSuccessMessage(
      response.data?.message ||
      "Become a Vendor settings saved successfully."
    );
  };



  // Save currently opened section.

  const handleSave = async () => {
    if (
      saving ||
      !activeEditor ||
      activeEditor === "hero"
    ) {
      return;
    }

    try {
      setSaving(true);
      setSectionError("");
      setSuccessMessage("");

      if (
        activeEditor ===
        "featured_categories"
      ) {
        await saveFeaturedCategories();
      } else if (
        activeEditor ===
        "products_on_sale"
      ) {
        await saveProductsOnSale();
      } else if (
        activeEditor ===
        "promotions"
      ) {
        await savePromotions();
      } else if (
        activeEditor ===
        "featured_products"
      ) {
        await saveFeaturedProducts();
      } else if (
        activeEditor ===
        "top_vendors"
      ) {
        await saveTopVendors();
      } else if (
        activeEditor ===
        "top_articles"
      ) {
        await saveTopArticles();
      } else if (
        activeEditor ===
        "from_instagram"
      ) {
        await saveInstagramGallery();
      } else if (
        activeEditor ===
        "become_a_vendor"
      ) {
        await saveBecomeVendor();
      }
    } catch (error) {
      console.error(
        "Home section save error:",
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

        setSectionError(
          firstError ||
          error.response?.data
            ?.message ||
          "Please check the section settings."
        );
      } else {
        setSectionError(
          error.response?.data
            ?.message ||
          "Unable to save section settings."
        );
      }
    } finally {
      setSaving(false);
    }
  };




  // Open storefront preview.
  const handlePreview = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  // Hero has its own editor page.
  if (activeEditor === "hero") {
    return (
      <HeroSliderEditor
        onBack={() => {
          setActiveEditor(null);
          setSuccessMessage("");
          setSectionError("");
        }}
      />
    );
  }

  const canSave = [
    "featured_categories",
    "products_on_sale",
    "promotions",
    "featured_products",
    "top_vendors",
    "become_a_vendor",
    "top_articles",
    "from_instagram",
  ].includes(activeEditor);

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f6f7f8] px-6 py-6">
      <div className="mx-auto max-w-[1125px]">
        {/* Page Builder header */}
        <div className="flex items-center justify-between gap-5 rounded-[16px] border border-[#e4e5e8] bg-white px-[22px] py-[20px] shadow-[0_3px_10px_rgba(0,0,0,0.04)]">
          <div>
            <h1 className="text-[24px] font-bold leading-[1.2] tracking-[-0.5px] text-[#111]">
              Page Builder
            </h1>

            <p className="mt-[7px] text-[15px] text-[#6b6f76]">
              Drag to reorder - toggle visibility - edit content
            </p>
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={handlePreview}
              className="flex h-[38px] items-center justify-center gap-[8px] rounded-[8px] border border-[#dedfe3] bg-white px-[16px] text-[14px] font-medium text-[#222] transition-colors hover:bg-[#f8f8f9]"
            >
              <ExternalLink size={16} />
              Preview
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex h-[38px] items-center justify-center gap-[8px] rounded-[8px] bg-[#2065D1] px-[17px] text-[14px] font-semibold text-white transition-colors hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:bg-[#82a9e4]"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[12px] text-green-700">
            {successMessage}
          </div>
        )}

        {sectionError && (
          <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
            {sectionError}
          </div>
        )}

        {sectionsLoading ? (
          <div className="mt-[22px] flex min-h-[300px] flex-col items-center justify-center rounded-[16px] border border-[#e2e3e6] bg-white">
            <LoaderCircle size={28} className="animate-spin text-[#2065D1]" />
            <p className="mt-3 text-[13px] text-[#777]">Loading homepage sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="mt-[22px] flex min-h-[220px] items-center justify-center rounded-[16px] border border-[#e2e3e6] bg-white text-[13px] text-[#777]">
            No homepage sections found.
          </div>
        ) : (
          <div className="mt-[22px] space-y-[12px]">
            {sections.map((section) => {
              const isFeaturedEditor =
                section.section_key === "featured_categories" &&
                activeEditor === "featured_categories";

              const isProductsOnSaleEditor =
                section.section_key === "products_on_sale" &&
                activeEditor === "products_on_sale";

              const isPromotionsEditor =
                section.section_key === "promotions" &&
                activeEditor === "promotions";

              const isFeaturedProductsEditor =
                section.section_key === "featured_products" &&
                activeEditor === "featured_products";

              const isTopVendorsEditor =
                section.section_key === "top_vendors" &&
                activeEditor === "top_vendors";

              const isBecomeVendorEditor =
                section.section_key === "become_a_vendor" &&
                activeEditor === "become_a_vendor";

              const isTopArticlesEditor =
                section.section_key ===
                "top_articles" &&
                activeEditor ===
                "top_articles";

              const isInstagramGalleryEditor =
                section.section_key ===
                "from_instagram" &&
                activeEditor ===
                "from_instagram";



              const editorOpen =

                isFeaturedEditor ||
                isProductsOnSaleEditor ||
                isPromotionsEditor ||
                isFeaturedProductsEditor ||
                isTopVendorsEditor ||
                isBecomeVendorEditor ||
                isTopArticlesEditor ||
                isInstagramGalleryEditor;


              let editorComponent = null;

              if (isFeaturedEditor) {
                editorComponent = (
                  <FeaturedCategoriesEditor
                    value={featuredDraft}
                    onChange={handleFeaturedChange}
                  />
                );
              }

              if (isProductsOnSaleEditor) {
                editorComponent = (
                  <ProductsOnSaleEditor
                    value={productsOnSaleDraft}
                    onChange={handleProductsOnSaleChange}
                  />
                );
              }

              if (isPromotionsEditor) {
                editorComponent = (
                  <PromotionsOffersEditor
                    value={promotionsDraft}
                    onChange={handlePromotionsChange}
                    onImageSelect={handlePromotionImageSelect}
                    onOpenAi={handlePromotionAiOpen}
                  />
                );
              }

              if (isFeaturedProductsEditor) {
                editorComponent = (
                  <FeaturedProductsEditor
                    value={featuredProductsDraft}
                    onChange={handleFeaturedProductsChange}
                  />
                );
              }

              if (isTopVendorsEditor) {
                editorComponent = (
                  <TopVendorsEditor
                    value={topVendorsDraft}
                    onChange={handleTopVendorsChange}
                  />
                );
              }

              if (isBecomeVendorEditor) {
                editorComponent = (
                  <BecomeVendorEditor
                    value={becomeVendorDraft}
                    onChange={
                      handleBecomeVendorChange
                    }
                    onImageSelect={
                      handleBecomeVendorImageSelect
                    }
                  />
                );
              }


              if (isTopArticlesEditor) {
                editorComponent = (
                  <TopArticlesEditor
                    value={
                      topArticlesDraft
                    }
                    onChange={
                      handleTopArticlesChange
                    }
                  />
                );
              }


              if (isInstagramGalleryEditor) {
                editorComponent = (
                  <InstagramGalleryEditor
                    draft={instagramGalleryDraft}
                    onChange={
                      handleInstagramGalleryChange
                    }
                  />
                );
              }

              return (
                <PageBuilderItem
                  key={section.id}
                  section={section}
                  toggling={togglingSection === section.section_key}
                  onToggle={() => handleToggleSection(section)}
                  onEdit={() => handleEditSection(section)}
                  editorOpen={editorOpen}
                  editor={editorComponent}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;