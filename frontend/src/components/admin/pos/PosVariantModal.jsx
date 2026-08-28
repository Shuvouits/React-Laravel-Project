import { X } from "lucide-react";

const PosVariantModal = ({
    product,
    onClose,
    onSelectVariant,
    formatMoney,
}) => {
    if (!product) {
        return null;
    }

    const variants = Array.isArray(product.variants)
        ? product.variants
        : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[520px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.20)]">

                {/* HEADER */}
                <div className="flex items-center gap-3 border-b border-[#e7e8eb] px-5 py-5">

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#f5f6f8]">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.title}
                                className="h-full w-full object-cover"
                            />
                        ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#111111]">
                            {product.title}
                        </h2>

                        <p className="mt-1 text-[12px] text-[#858790]">
                            Select a variant
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#55565d] transition hover:bg-[#f4f5f7]"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* VARIANTS */}
                <div className="max-h-[510px] space-y-2 overflow-y-auto p-4">

                    {variants.map((variant) => {

                        const disabled =
                            !variant.in_stock &&
                            !product.continue_selling_when_out_of_stock;

                        return (
                            <button
                                key={variant.id}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                    onSelectVariant(
                                        product,
                                        variant
                                    )
                                }
                                className={[
                                    "w-full rounded-[16px] border px-4 py-4 text-left transition",
                                    disabled
                                        ? "cursor-not-allowed border-[#ececef] bg-[#fafafa] opacity-50"
                                        : "border-[#e2e3e7] bg-white hover:border-[#01b8af] hover:bg-[#f8ffff]",
                                ].join(" ")}
                            >
                                <div className="flex items-center gap-4">

                                    {/* VARIANT IMAGE */}
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#f5f6f8]">
                                        {variant.image_url ? (
                                            <img
                                                src={variant.image_url}
                                                alt={variant.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={product.image_url}
                                                alt={product.title}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* INFO */}
                                    <div className="min-w-0 flex-1">

                                        <p className="truncate text-[13px] font-semibold text-[#17181b]">
                                            {variant.title}
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">

                                            {variant.sku && (
                                                <span className="text-[#92959e]">
                                                    # {variant.sku}
                                                </span>
                                            )}

                                            <span className="text-[#d2d3d7]">
                                                |
                                            </span>

                                            <span
                                                className={
                                                    variant.available_quantity > 0
                                                        ? "font-medium text-[#16a34a]"
                                                        : "font-medium text-[#ef4444]"
                                                }
                                            >
                                                {variant.available_quantity > 0
                                                    ? `${variant.available_quantity} in stock`
                                                    : "Out of stock"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* PRICE */}
                                    <div className="shrink-0 text-[14px] font-semibold text-[#111111]">
                                        {formatMoney(
                                            variant.price
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                </div>
            </div>
        </div>
    );
};

export default PosVariantModal;