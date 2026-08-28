const PosProductCard = ({ product, onAdd, formatMoney }) => {
    const disabled =
        !product.in_stock &&
        !product.continue_selling_when_out_of_stock;

    const handleClick = () => {
        if (disabled) {
            return;
        }

        // Product has variants → let parent open variant modal
        if (product.has_variants) {
            onAdd(product);
            return;
        }

        // No variants → directly add to cart
        onAdd(product);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className="group overflow-hidden rounded-[16px] border border-[#e1e3e8] bg-white text-left transition hover:-translate-y-[1px] hover:border-[#bfc5d0] hover:shadow-[0_5px_18px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
        >
            <div className="aspect-square overflow-hidden bg-[#f5f6f8]">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-[#9a9ca3]">
                        No image
                    </div>
                )}
            </div>

            <div className="p-4">
                <p className="line-clamp-2 min-h-[40px] text-[14px] font-medium leading-5 text-[#17181b]">
                    {product.title}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-[#111111]">
                        {formatMoney(product.price)}
                    </span>

                    {product.has_variants ? (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[11px] font-medium text-[#64748b]">
                            {product.variant_count} variants
                        </span>
                    ) : (
                        <span className="text-[11px] text-[#8a8c94]">
                            Stock: {product.available_quantity}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default PosProductCard;