import { LoaderCircle, ShoppingCart } from "lucide-react";

import PosProductCard from "./PosProductCard";

const PosProductSection = ({
    categories,
    selectedCategoryId,
    onCategoryChange,
    products,
    productsLoading,
    pagination,
    onAddProduct,
    formatMoney,
}) => {
    return (
        <section>
          

            {/* CATEGORY FILTER */}
            {categories.length > 0 && (
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => onCategoryChange("")}
                        className={[
                            "shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition",
                            selectedCategoryId === ""
                                ? "bg-[#111827] text-white"
                                : "border border-[#dedfe4] bg-white text-[#666871] hover:bg-[#f4f5f7]",
                        ].join(" ")}
                    >
                        All
                    </button>

                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() =>
                                onCategoryChange(String(category.id))
                            }
                            className={[
                                "shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition",
                                String(selectedCategoryId) ===
                                String(category.id)
                                    ? "bg-[#111827] text-white"
                                    : "border border-[#dedfe4] bg-white text-[#666871] hover:bg-[#f4f5f7]",
                            ].join(" ")}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            )}

            {/* PRODUCTS */}
            {productsLoading ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-[18px] border border-dashed border-[#dfe1e6] bg-white">
                    <LoaderCircle
                        size={30}
                        className="animate-spin text-[#2563eb]"
                    />
                </div>
            ) : products.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-[18px] border border-dashed border-[#dfe1e6] bg-white">
                    <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7]">
                            <ShoppingCart
                                size={20}
                                className="text-[#9ca0aa]"
                            />
                        </div>

                        <p className="text-[14px] font-medium text-[#34363c]">
                            No products found
                        </p>

                        <p className="mt-1 text-[12px] text-[#92959e]">
                            Try another search or category.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {products.map((product) => (
                        <PosProductCard
                            key={product.id}
                            product={product}
                            onAdd={onAddProduct}
                            formatMoney={formatMoney}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default PosProductSection;