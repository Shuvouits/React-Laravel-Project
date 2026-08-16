import {
    LoaderCircle,
    Trash2,
    X,
} from "lucide-react";

const DeleteOrderModal = ({
    open,
    order,
    loading,
    onClose,
    onConfirm,
}) => {
    if (!open || !order) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-[20px]">

            <div className="relative w-full max-w-[575px] overflow-hidden rounded-[26px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]">

                <div className="h-[3px] w-full bg-red-500" />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-[24px] top-[24px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#8a8a8a] transition hover:bg-[#f5f5f5] hover:text-[#444] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="px-[32px] pb-[30px] pt-[30px] text-center">

                    <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-red-100">

                        <Trash2
                            size={28}
                            className="text-red-500"
                        />

                    </div>

                    <h2 className="mt-[24px] text-[26px] font-semibold text-[#2b2b2b]">
                        Delete Order
                    </h2>

                    <p className="mx-auto mt-[14px] max-w-[440px] text-[17px] leading-[26px] text-[#808080]">
                        Are you sure you want to delete "{order.order_no}"?
                        <br />
                        This action cannot be undone.
                    </p>

                    <div className="mt-[32px] grid grid-cols-2 gap-[16px]">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-[52px] items-center justify-center rounded-[15px] border border-[#dedede] bg-white text-[17px] font-medium text-[#2d2d2d] transition hover:bg-[#f8f8f8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex h-[52px] items-center justify-center gap-[8px] rounded-[15px] bg-[#ff0b17] text-[17px] font-semibold text-white transition hover:bg-[#e90712] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading && (
                                <LoaderCircle
                                    size={19}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default DeleteOrderModal;