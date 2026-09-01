import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    CalendarDays,
    ChevronRight,
    Clock3,
    Eye,
    MessageCircle,
    Send,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../../api/axios";

const BlogDetailsPage = () => {
    const { slug } = useParams();

    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [commentForm, setCommentForm] = useState({
        name: "",
        email: "",
        comment: "",
    });

    useEffect(() => {
        fetchPost();
    }, [slug]);

    useEffect(() => {
        if (!post) {
            return;
        }

        const previousTitle = document.title;
        const previousDescription = document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content");

        document.title =
            post.seo?.title ||
            post.title ||
            "Blog Details";

        let descriptionMeta = document.querySelector(
            'meta[name="description"]'
        );

        if (!descriptionMeta) {
            descriptionMeta = document.createElement("meta");
            descriptionMeta.setAttribute("name", "description");
            document.head.appendChild(descriptionMeta);
        }

        descriptionMeta.setAttribute(
            "content",
            post.seo?.meta_description ||
            post.excerpt ||
            ""
        );

        return () => {
            document.title = previousTitle;

            if (
                descriptionMeta &&
                previousDescription !== undefined
            ) {
                descriptionMeta.setAttribute(
                    "content",
                    previousDescription || ""
                );
            }
        };
    }, [post]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/blog/posts/${slug}`
            );

            if (!response.data?.status) {
                throw new Error(
                    response.data?.message ||
                    "Blog post could not be loaded."
                );
            }

            setPost(response.data.post);
            setRelatedPosts(
                response.data.related_posts || []
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (requestError) {
            console.error(
                "Blog details load error:",
                requestError
            );

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Blog post could not be loaded."
            );
        } finally {
            setLoading(false);
        }
    };

    const readingTime = useMemo(() => {
        if (!post?.content) {
            return 1;
        }

        const plainText = post.content
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const words = plainText
            ? plainText.split(" ").length
            : 0;

        return Math.max(
            1,
            Math.ceil(words / 220)
        );
    }, [post]);

    const handleCommentChange = (event) => {
        const { name, value } = event.target;

        setCommentForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const handleCommentSubmit = async (event) => {
        event.preventDefault();

        if (
            !commentForm.name.trim() ||
            !commentForm.email.trim() ||
            !commentForm.comment.trim()
        ) {
            showToast(
                "Please complete all comment fields.",
                "warning"
            );

            return;
        }

        try {
            setSubmitting(true);

            const response = await api.post(
                `/blog/posts/${slug}/comments`,
                commentForm
            );

            if (!response.data?.status) {
                throw new Error(
                    response.data?.message ||
                    "Comment could not be submitted."
                );
            }

            setCommentForm({
                name: "",
                email: "",
                comment: "",
            });

            showToast(
                response.data.message ||
                "Your comment has been submitted.",
                "success"
            );

            await fetchPost();
        } catch (requestError) {
            console.error(
                "Comment submit error:",
                requestError
            );

            const validationErrors =
                requestError.response?.data?.errors;

            const firstValidationError =
                validationErrors
                    ? Object.values(validationErrors)
                        .flat()[0]
                    : null;

            showToast(
                firstValidationError ||
                requestError.response?.data?.message ||
                requestError.message ||
                "Comment could not be submitted.",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <BlogDetailsSkeleton />;
    }

    if (error || !post) {
        return (
            <section className="mx-auto max-w-[1480px] px-4 py-24 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Blog post not found
                    </h1>

                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>

                    <Link
                        to="/blog"
                        className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Return to Blog
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <main className="bg-white">
            <article>
                <section className="mx-auto max-w-[1480px] px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
                    <BlogBreadcrumb post={post} />

                    <div className="mx-auto mt-10 max-w-[1050px] text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {post.categories?.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/blog?category=${category.slug}`}
                                    className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:border-black hover:text-black"
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>

                        <h1 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.03em] text-[#141414] sm:text-4xl lg:text-[54px] lg:leading-[1.15]">
                            {post.title}
                        </h1>

                        {post.excerpt && (
                            <p className="mx-auto mt-6 max-w-[900px] text-base leading-7 text-gray-500 sm:text-lg">
                                {post.excerpt}
                            </p>
                        )}

                        <PostMeta
                            post={post}
                            readingTime={readingTime}
                        />
                    </div>

                    {post.featured_image_url && (
                        <div className="mx-auto mt-10 max-w-[1120px] overflow-hidden rounded-2xl bg-gray-100">
                            <img
                                src={post.featured_image_url}
                                alt={
                                    post.featured_image_alt ||
                                    post.title
                                }
                                className="max-h-[700px] w-full object-cover"
                            />
                        </div>
                    )}
                </section>

                <section className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 lg:py-12">
                    <div
                        className="
                            blog-article-content
                            text-[17px]
                            leading-8
                            text-[#252525]
                            [&_a]:font-medium
                            [&_a]:text-blue-600
                            [&_a]:underline
                            [&_blockquote]:my-8
                            [&_blockquote]:border-l-4
                            [&_blockquote]:border-black
                            [&_blockquote]:bg-gray-50
                            [&_blockquote]:px-6
                            [&_blockquote]:py-5
                            [&_h1]:mb-5
                            [&_h1]:mt-10
                            [&_h1]:text-4xl
                            [&_h1]:font-bold
                            [&_h2]:mb-4
                            [&_h2]:mt-10
                            [&_h2]:text-3xl
                            [&_h2]:font-bold
                            [&_h3]:mb-3
                            [&_h3]:mt-8
                            [&_h3]:text-2xl
                            [&_h3]:font-bold
                            [&_h4]:mb-3
                            [&_h4]:mt-7
                            [&_h4]:text-xl
                            [&_h4]:font-semibold
                            [&_img]:my-8
                            [&_img]:w-full
                            [&_img]:rounded-xl
                            [&_li]:mb-2
                            [&_ol]:my-5
                            [&_ol]:list-decimal
                            [&_ol]:pl-7
                            [&_p]:mb-5
                            [&_strong]:font-semibold
                            [&_ul]:my-5
                            [&_ul]:list-disc
                            [&_ul]:pl-7
                        "
                        dangerouslySetInnerHTML={{
                            __html: post.content || "",
                        }}
                    />

                    {post.tags?.length > 0 && (
                        <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-7">
                            <span className="mr-2 text-sm font-semibold text-gray-900">
                                Tags:
                            </span>

                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </section>
            </article>

            {relatedPosts.length > 0 && (
                <RelatedPosts posts={relatedPosts} />
            )}

            {post.allow_comments && (
                <CommentsSection
                    post={post}
                    form={commentForm}
                    submitting={submitting}
                    onChange={handleCommentChange}
                    onSubmit={handleCommentSubmit}
                />
            )}
        </main>
    );
};

const BlogBreadcrumb = ({ post }) => {
    return (
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
                to="/"
                className="transition hover:text-black"
            >
                Home
            </Link>

            <ChevronRight size={15} />

            <Link
                to="/blog"
                className="transition hover:text-black"
            >
                Blog
            </Link>

            <ChevronRight size={15} />

            <span className="max-w-[500px] truncate font-medium text-gray-900">
                {post.title}
            </span>
        </nav>
    );
};

const PostMeta = ({ post, readingTime }) => {
    const authorName =
        post.author?.name || "Admin User";

    return (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
                {post.author?.photo_url ? (
                    <img
                        src={post.author.photo_url}
                        alt={authorName}
                        className="h-9 w-9 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {authorName.charAt(0).toUpperCase()}
                    </div>
                )}

                <span className="font-semibold text-gray-900">
                    {authorName}
                </span>
            </div>

            <span className="flex items-center gap-1.5">
                <CalendarDays size={17} />
                {post.published_date || "Not available"}
            </span>

            <span className="flex items-center gap-1.5">
                <Clock3 size={17} />
                {readingTime} min read
            </span>

            <span className="flex items-center gap-1.5">
                <MessageCircle size={17} />
                {post.comments_count || 0} comments
            </span>

            <span className="flex items-center gap-1.5">
                <Eye size={17} />
                {post.views_count || 0} views
            </span>
        </div>
    );
};

const RelatedPosts = ({ posts }) => {
    return (
        <section className="border-y border-gray-200 bg-[#fafafa]">
            <div className="mx-auto max-w-[1480px] px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                        Related Articles
                    </h2>

                    <Link
                        to="/blog"
                        className="text-sm font-semibold text-gray-600 transition hover:text-black"
                    >
                        View all articles
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.slice(0, 3).map((relatedPost) => (
                        <article
                            key={relatedPost.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <Link
                                to={`/blog/${relatedPost.slug}`}
                                className="block aspect-[16/10] overflow-hidden bg-gray-100"
                            >
                                {relatedPost.featured_image_url ? (
                                    <img
                                        src={
                                            relatedPost.featured_image_url
                                        }
                                        alt={
                                            relatedPost.featured_image_alt ||
                                            relatedPost.title
                                        }
                                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                        No image
                                    </div>
                                )}
                            </Link>

                            <div className="p-6">
                                <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-500">
                                    {relatedPost.published_date}
                                </p>

                                <Link
                                    to={`/blog/${relatedPost.slug}`}
                                >
                                    <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-7 text-gray-950 hover:text-blue-600">
                                        {relatedPost.title}
                                    </h3>
                                </Link>

                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                                    {relatedPost.excerpt}
                                </p>

                                <Link
                                    to={`/blog/${relatedPost.slug}`}
                                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
                                >
                                    Read More
                                    <ChevronRight size={16} />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CommentsSection = ({
    post,
    form,
    submitting,
    onChange,
    onSubmit,
}) => {
    const comments = post.comments || [];

    return (
        <section className="mx-auto max-w-[860px] px-4 py-16 sm:px-6 lg:py-20">
            <div>
                <h2 className="text-2xl font-bold text-gray-950">
                    Comments
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    {post.comments_count || comments.length} comments
                </p>
            </div>

            <div className="mt-8 space-y-4">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="rounded-xl border border-gray-200 p-5"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600">
                                    {comment.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-950">
                                        {comment.name}
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {comment.created_date ||
                                            comment.created_at}
                                    </p>

                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        {comment.comment}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-500">
                        Be the first to comment.
                    </div>
                )}
            </div>

            <form
                onSubmit={onSubmit}
                className="mt-9 rounded-2xl border border-gray-200 p-5 sm:p-7"
            >
                <h3 className="text-xl font-bold text-gray-950">
                    Leave a comment
                </h3>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <FormField
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                    />

                    <FormField
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                    />
                </div>

                <div className="mt-5">
                    <label
                        htmlFor="comment"
                        className="mb-2 block text-sm font-medium text-gray-900"
                    >
                        Comment
                    </label>

                    <textarea
                        id="comment"
                        name="comment"
                        rows="5"
                        value={form.comment}
                        onChange={onChange}
                        placeholder="Write your comment..."
                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#286bd6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5dbc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Send size={17} />

                    {submitting
                        ? "Posting..."
                        : "Post comment"}
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
    onChange,
}) => {
    return (
        <div>
            <label
                htmlFor={name}
                className="mb-2 block text-sm font-medium text-gray-900"
            >
                {label}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
};

const BlogDetailsSkeleton = () => {
    return (
        <section className="mx-auto max-w-[1120px] animate-pulse px-4 py-16 sm:px-6">
            <div className="h-4 w-64 rounded bg-gray-200" />

            <div className="mx-auto mt-16 h-12 max-w-[750px] rounded bg-gray-200" />

            <div className="mx-auto mt-4 h-6 max-w-[580px] rounded bg-gray-100" />

            <div className="mx-auto mt-7 h-10 w-80 rounded bg-gray-100" />

            <div className="mt-12 aspect-[16/8] rounded-2xl bg-gray-200" />

            <div className="mx-auto mt-12 max-w-[800px] space-y-4">
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 w-4/5 rounded bg-gray-100" />
            </div>
        </section>
    );
};

const showToast = (message, icon = "success") => {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
};

export default BlogDetailsPage;