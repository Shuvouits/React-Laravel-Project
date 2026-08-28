import {
    Minus,
    Plus,
    Trash2,
} from "lucide-react";

const PosCartItem = ({
    item,
    onIncrease,
    onDecrease,
    onRemove,
    formatMoney,
}) => {
    const productName =
        item.title ||
        item.product_title ||
        item.name ||
        item.product_name ||
        item.product?.title ||
        item.product?.name ||
        "Product";

    const variantName =
        item.variant_title ||
        item.variant_name ||
        item.variantName ||
        item.variant?.title ||
        item.variant?.name ||
        null;

    const quantity = Math.max(
        Number(item.quantity || 1),
        1
    );

    const price = Number(
        item.unit_price ??
        item.price ??
        item.sale_price ??
        0
    );

    const image =
        item.image_url ||
        item.image ||
        item.product?.image_url ||
        item.product?.image ||
        null;

    const reachedMaximum =
        !item.continue_selling_when_out_of_stock &&
        Number(item.available_quantity || 0) > 0 &&
        quantity >= Number(item.available_quantity);

    return (
        <div className="px-6 py-[18px]">
            <div className="flex items-start gap-3">
                <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f5f6f7]">
                    {image ? (
                        <img
                            src={image}
                            alt={productName}
                            className="h-full w-full object-contain p-1"
                        />
                    ) : (
                        <span className="text-[9px] text-[#a2a4ab]">
                            No image
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-semibold leading-5 text-[#17181a]">
                                {productName}
                            </h3>

                            {variantName && (
                                <p className="mt-0.5 truncate text-[11px] leading-4 text-[#858890]">
                                    {variantName}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => onRemove(item)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#aaaeb5] transition hover:bg-[#fff1f2] hover:text-[#e5484d]"
                            title="Remove item"
                            aria-label={`Remove ${productName}`}
                        >
                            <Trash2
                                size={15}
                                strokeWidth={1.7}
                            />
                        </button>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[14px] font-semibold leading-5 text-[#111214]">
                                {formatMoney(price * quantity)}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-[#9a9ca4]">
                                {formatMoney(price)} each
                            </p>
                        </div>

                        <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-[9px] border border-[#dfe1e5] bg-white">
                            <button
                                type="button"
                                onClick={() => onDecrease(item)}
                                disabled={quantity <= 1}
                                className="flex h-full w-8 items-center justify-center text-[#666970] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:text-[#c9cbd0]"
                                aria-label="Decrease quantity"
                            >
                                <Minus
                                    size={13}
                                    strokeWidth={1.8}
                                />
                            </button>

                            <span className="flex h-full min-w-[34px] items-center justify-center border-x border-[#dfe1e5] px-2 text-[12px] font-medium text-[#111214]">
                                {quantity}
                            </span>

                            <button
                                type="button"
                                onClick={() => onIncrease(item)}
                                disabled={reachedMaximum}
                                className="flex h-full w-8 items-center justify-center text-[#666970] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:text-[#c9cbd0]"
                                aria-label="Increase quantity"
                            >
                                <Plus
                                    size={13}
                                    strokeWidth={1.8}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosCartItem;