import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import api from "../../../../api/axios";

import BlogCategoryForm
    from "../../../../components/admin/blog/categories/BlogCategoryForm";

import {
    getErrorMessage,
} from "../../../../components/admin/blog/categories/blogCategoryConfig";

const AdminBlogCategoryEdit = () => {
    const {
        id,
    } = useParams();

    const navigate = useNavigate();

    const [category, setCategory] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");

    const fetchCategory = useCallback(
        async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const response = await api.get(
                    `/admin/blog-categories/${id}`
                );

                setCategory(
                    response.data?.category || null
                );
            } catch (error) {
                setCategory(null);

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Failed to load the blog category."
                    )
                );
            } finally {
                setLoading(false);
            }
        },
        [id]
    );

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[#f6f6f7]">
                <div className="flex flex-col items-center">
                    <LoaderCircle
                        size={30}
                        className="animate-spin text-[#2167d9]"
                    />

                    <p className="mt-3 text-[13px] text-[#777b83]">
                        Loading blog category...
                    </p>
                </div>
            </div>
        );
    }

    if (
        errorMessage ||
        !category
    ) {
        return (
            <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[#f6f6f7] p-6">
                <div className="w-full max-w-[480px] rounded-[18px] border border-[#e1e2e5] bg-white p-7 text-center shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <AlertCircle size={23} />
                    </div>

                    <h2 className="mt-4 text-[18px] font-semibold text-[#111214]">
                        Unable to load category
                    </h2>

                    <p className="mt-2 text-[13px] leading-6 text-[#777b83]">
                        {errorMessage ||
                            "The requested blog category was not found."}
                    </p>

                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/admin/content/blog-categories"
                                )
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dedfe2] bg-white px-4 text-[13px] font-medium text-[#303238] transition hover:bg-[#f7f7f8]"
                        >
                            <ArrowLeft size={15} />
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={
                                fetchCategory
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2167d9] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1859c2]"
                        >
                            <RefreshCw size={15} />
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BlogCategoryForm
            mode="edit"
            initialData={category}
        />
    );
};

export default AdminBlogCategoryEdit;