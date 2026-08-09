import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const PromotionsOffers = () => {
  const [section, setSection] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await api.get("/home/promotions");
        setSection(response.data?.section || null);
        setCards(response.data?.cards || []);
      } catch (error) {
        console.error("Promotions error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  if (loading) return <PromotionsSkeleton />;
  if (!section || !cards.length) return null;

  return (
    <section className="w-full bg-white py-[28px] md:py-[38px]">
      <div className="mx-auto max-w-[1280px] px-4 md:px-5">
        {section?.title && (
          <h2 className="mb-[22px] text-[26px] font-bold tracking-[-0.4px] text-[#171717]">
            {section.title}
          </h2>
        )}

        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:h-[555px] lg:grid-cols-4 lg:grid-rows-2 lg:gap-[18px]">
          {cards.map((card, index) => (
            <PromotionCard key={`${card.layout}-${index}`} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const PromotionCard = ({ card, index }) => {
  if (!card?.image_url) return null;

  const layoutClass = {
    tall_left: "lg:col-span-1 lg:row-span-2",
    tall_middle: "lg:col-span-1 lg:row-span-2",
    square_top_right: "lg:col-span-1 lg:row-span-1",
    square_top_right_arrow: "lg:col-span-1 lg:row-span-1",
    wide_bottom_banner: "lg:col-span-2 lg:row-span-1",
  }[card.layout] || "";

  const className = `group relative block min-h-[260px] overflow-hidden rounded-[14px] bg-[#f5f5f5] sm:min-h-[320px] lg:min-h-0 ${layoutClass}`;

  const content = (
    <>
      <img
        src={card.image_url}
        alt={card.image_alt || `Promotion ${index + 1}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
      />
      <span className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-black/[0.04]" />
    </>
  );

  if (isExternalLink(card.link)) {
    return (
      <a href={card.link} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={card.link || "/products"} className={className}>
      {content}
    </Link>
  );
};

const isExternalLink = (link = "") => {
  return link.startsWith("http://") || link.startsWith("https://");
};

const PromotionsSkeleton = () => (
  <section className="w-full bg-white py-[38px]">
    <div className="mx-auto max-w-[1280px] px-4 md:px-5">
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:h-[555px] lg:grid-cols-4 lg:grid-rows-2 lg:gap-[18px]">
        <SkeletonCard className="lg:row-span-2" />
        <SkeletonCard className="lg:row-span-2" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="lg:col-span-2" />
      </div>
    </div>
  </section>
);

const SkeletonCard = ({ className = "" }) => (
  <div className={`min-h-[260px] animate-pulse rounded-[14px] bg-[#f3f4f6] sm:min-h-[320px] lg:min-h-0 ${className}`} />
);

export default PromotionsOffers;