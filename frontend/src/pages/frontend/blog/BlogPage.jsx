import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../../../api/axios";

const BlogPage = () => {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const category =
    searchParams.get("category") || "";

  const page = Math.max(
    1,
    Number(searchParams.get("page")) || 1
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [categories, setCategories] =
    useState([]);

  const [featuredPost, setFeaturedPost] =
    useState(null);

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] =
    useState(null);

  useEffect(() => {
    fetchPosts();
  }, [category, page]);

  useEffect(() => {
    document.title =
      "Latest Guides and News | Storify";
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        per_page: 6,
      };

      if (category) {
        params.category = category;
      }

      const response = await api.get(
        "/blog/posts",
        {
          params,
        }
      );

      setCategories(
        response.data?.categories || []
      );

      setFeaturedPost(
        response.data?.featured_post || null
      );

      setPosts(
        response.data?.posts?.data || []
      );

      setPagination(
        response.data?.posts || null
      );
    } catch (error) {
      console.error(
        "Blog posts fetch error:",
        error.response?.data ||
          error.message
      );

      setError(
        "Blog posts could not be loaded. Please try again."
      );

      setFeaturedPost(null);
      setPosts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (
    categorySlug
  ) => {
    const params = new URLSearchParams();

    if (categorySlug) {
      params.set(
        "category",
        categorySlug
      );
    }

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePageChange = (
    nextPage
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    if (nextPage > 1) {
      params.set(
        "page",
        String(nextPage)
      );
    } else {
      params.delete("page");
    }

    setSearchParams(params);

    window.scrollTo({
      top: 600,
      behavior: "smooth",
    });
  };

  if (loading) {
    return <BlogPageLoader />;
  }

  return (
    <main className="min-h-screen bg-white font-['Inter'] text-[#171717]">
      <div className="mx-auto w-full max-w-[1500px] px-5 pb-[90px] pt-[52px]">
        <BlogBreadcrumb />

        <section className="pt-[42px]">
          <div className="mx-auto max-w-[900px] text-center">
            <h1 className="text-[38px] font-bold leading-[1.2] tracking-[-0.8px] text-[#111111]">
              Latest Guides and News
            </h1>

            <p className="mx-auto mt-[18px] max-w-[760px] text-[16px] leading-[1.7] text-[#555555]">
              Helpful stories, product guides,
              technology updates, and practical
              ideas from the Storify team.
            </p>

            <CategoryFilter
              categories={categories}
              activeCategory={category}
              onChange={
                handleCategoryChange
              }
            />
          </div>
        </section>

        {error ? (
          <BlogError
            message={error}
            onRetry={fetchPosts}
          />
        ) : (
          <>
            {featuredPost && (
              <FeaturedPost
                post={featuredPost}
              />
            )}

            <LatestPostsSection
              posts={posts}
              total={
                pagination?.total || 0
              }
            />

            <BlogPagination
              pagination={pagination}
              onChange={
                handlePageChange
              }
            />
          </>
        )}
      </div>
    </main>
  );
};

const BlogBreadcrumb = () => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-[12px] text-[14px]"
    >
      <Link
        to="/"
        className="text-[#6b7280] transition-colors hover:text-[#2065D1]"
      >
        Home
      </Link>

      <ChevronRight
        size={15}
        strokeWidth={1.8}
        className="text-[#8b8b8b]"
      />

      <span className="font-medium text-[#171717]">
        Blog
      </span>
    </nav>
  );
};

const CategoryFilter = ({
  categories,
  activeCategory,
  onChange,
}) => {
  return (
    <div className="mt-[27px] flex flex-wrap items-center justify-center gap-[10px]">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`min-w-[72px] rounded-full border px-[20px] py-[8px] text-[13px] font-medium transition-all ${
          !activeCategory
            ? "border-[#171717] bg-[#171717] text-white"
            : "border-[#dedede] bg-white text-[#333333] hover:border-[#171717]"
        }`}
      >
        All
      </button>

      {categories.map(
        (category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              onChange(category.slug)
            }
            className={`rounded-full border px-[20px] py-[8px] text-[13px] font-medium transition-all ${
              activeCategory ===
              category.slug
                ? "border-[#171717] bg-[#171717] text-white"
                : "border-[#dedede] bg-white text-[#333333] hover:border-[#171717]"
            }`}
          >
            {category.name}

            {category.posts_count > 0 && (
              <span className="ml-[5px] opacity-60">
                {category.posts_count}
              </span>
            )}
          </button>
        )
      )}
    </div>
  );
};

const FeaturedPost = ({ post }) => {
  return (
    <section className="mt-[76px] overflow-hidden rounded-[18px] border border-[#e4e4e4] bg-white">
      <div className="grid min-h-[430px] grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <Link
          to={`/blog/${post.slug}`}
          className="group block overflow-hidden bg-[#f3f4f6]"
        >
          <BlogImage
            src={post.featured_image_url}
            alt={
              post.featured_image_alt ||
              post.title
            }
            className="h-[330px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] lg:h-full"
          />
        </Link>

        <div className="flex flex-col justify-center px-[34px] py-[38px] lg:px-[52px]">
          <PostCategories
            categories={post.categories}
          />

          <Link
            to={`/blog/${post.slug}`}
            className="mt-[15px]"
          >
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.6px] text-[#111111] transition-colors hover:text-[#2065D1]">
              {post.title}
            </h2>
          </Link>

          <p className="mt-[22px] overflow-hidden text-[16px] leading-[1.75] text-[#666666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
            {post.excerpt}
          </p>

          <div className="mt-[34px] flex flex-wrap items-center justify-between gap-5">
            <AuthorInfo
              author={post.author}
              date={post.published_date}
            />

            <ReadMoreButton
              slug={post.slug}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const LatestPostsSection = ({
  posts,
  total,
}) => {
  return (
    <section className="mt-[74px]">
      <div className="flex items-center gap-[15px]">
        <h2 className="shrink-0 text-[13px] font-bold uppercase tracking-[0.3px] text-[#171717]">
          Latest Articles
        </h2>

        <div className="h-px flex-1 bg-[#dddddd]" />

        <span className="flex h-[25px] min-w-[25px] items-center justify-center rounded-full border border-[#dedede] px-[7px] text-[11px] text-[#666666]">
          {total}
        </span>
      </div>

      {posts.length ? (
        <div className="mt-[28px] grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      ) : (
        <EmptyBlogState />
      )}
    </section>
  );
};

const BlogCard = ({ post }) => {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[#e1e1e1] bg-white transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_35px_rgba(0,0,0,0.08)]">
      <Link
        to={`/blog/${post.slug}`}
        className="block h-[255px] overflow-hidden bg-[#f3f4f6]"
      >
        <BlogImage
          src={post.featured_image_url}
          alt={
            post.featured_image_alt ||
            post.title
          }
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
      </Link>

      <div className="flex flex-1 flex-col px-[26px] pb-[24px] pt-[25px]">
        <PostCategories
          categories={post.categories}
          compact
        />

        <Link
          to={`/blog/${post.slug}`}
          className="mt-[10px]"
        >
          <h3 className="overflow-hidden text-[20px] font-bold leading-[1.35] tracking-[-0.25px] text-[#111111] transition-colors hover:text-[#2065D1] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {post.title}
          </h3>
        </Link>

        <p className="mt-[16px] overflow-hidden text-[14px] leading-[1.75] text-[#666666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-[28px]">
          <AuthorInfo
            author={post.author}
            date={post.published_date}
            compact
          />

          <ReadMoreButton
            slug={post.slug}
            compact
          />
        </div>
      </div>
    </article>
  );
};

const PostCategories = ({
  categories = [],
  compact = false,
}) => {
  if (!categories.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-[7px]">
      {categories
        .slice(0, compact ? 1 : 2)
        .map((category) => (
          <Link
            key={category.id}
            to={`/blog?category=${category.slug}`}
            className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#2065D1] hover:underline"
          >
            {category.name}
          </Link>
        ))}
    </div>
  );
};

const AuthorInfo = ({
  author,
  date,
  compact = false,
}) => {
  const authorName =
    author?.name || "Storify Admin";

  const initials = getInitials(
    authorName
  );

  const avatarSize = compact
    ? "h-[42px] w-[42px]"
    : "h-[46px] w-[46px]";

  return (
    <div className="flex min-w-0 items-center gap-[11px]">
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2f2f2] ${avatarSize}`}
      >
        {author?.photo_url ? (
          <img
            src={author.photo_url}
            alt={authorName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[12px] font-semibold text-[#555555]">
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-[#171717]">
          {authorName}
        </p>

        <p className="mt-[2px] text-[12px] text-[#777777]">
          {date || ""}
        </p>
      </div>
    </div>
  );
};

const ReadMoreButton = ({
  slug,
  compact = false,
}) => {
  return (
    <Link
      to={`/blog/${slug}`}
      className={`flex shrink-0 items-center justify-center gap-[10px] rounded-full border border-[#222222] font-semibold text-[#171717] transition-all hover:bg-[#171717] hover:text-white ${
        compact
          ? "h-[40px] px-[18px] text-[12px]"
          : "h-[44px] px-[22px] text-[13px]"
      }`}
    >
      Read More
      <ArrowRight size={15} />
    </Link>
  );
};

const BlogPagination = ({
  pagination,
  onChange,
}) => {
  if (
    !pagination ||
    pagination.last_page <= 1
  ) {
    return null;
  }

  const currentPage =
    pagination.current_page;

  const lastPage =
    pagination.last_page;

  const pages = [];

  for (
    let page = 1;
    page <= lastPage;
    page += 1
  ) {
    pages.push(page);
  }

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-[54px] flex items-center justify-center gap-[8px]"
    >
      <button
        type="button"
        onClick={() =>
          onChange(currentPage - 1)
        }
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#dedede] text-[#333333] transition hover:border-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={`flex h-[42px] min-w-[42px] items-center justify-center rounded-full border px-[10px] text-[13px] font-semibold transition ${
            currentPage === page
              ? "border-[#171717] bg-[#171717] text-white"
              : "border-[#dedede] bg-white text-[#333333] hover:border-[#171717]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange(currentPage + 1)
        }
        disabled={
          currentPage >= lastPage
        }
        aria-label="Next page"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#dedede] text-[#333333] transition hover:border-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};

const BlogImage = ({
  src,
  alt,
  className,
}) => {
  const [imageError, setImageError] =
    useState(false);

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-[#f2f3f5] ${className}`}
      >
        <span className="text-[13px] font-medium text-[#999999]">
          Storify
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() =>
        setImageError(true)
      }
      className={className}
    />
  );
};

const EmptyBlogState = () => {
  return (
    <div className="mt-[28px] flex min-h-[260px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-[#fafafa] px-6 text-center">
      <div>
        <h3 className="text-[18px] font-semibold text-[#222222]">
          No articles found
        </h3>

        <p className="mt-[8px] text-[14px] text-[#777777]">
          There are no published articles in
          this category yet.
        </p>
      </div>
    </div>
  );
};

const BlogError = ({
  message,
  onRetry,
}) => {
  return (
    <div className="mt-[70px] flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#f0d6d6] bg-[#fffafa] px-6 text-center">
      <div>
        <h3 className="text-[18px] font-semibold text-[#222222]">
          Unable to load articles
        </h3>

        <p className="mt-[9px] text-[14px] text-[#777777]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-[20px] rounded-full bg-[#171717] px-[22px] py-[10px] text-[13px] font-semibold text-white transition hover:bg-[#333333]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

const BlogPageLoader = () => {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1500px] animate-pulse px-5 pb-[90px] pt-[52px]">
        <div className="h-[16px] w-[120px] rounded bg-[#eeeeee]" />

        <div className="mx-auto mt-[68px] h-[42px] w-[390px] max-w-full rounded bg-[#eeeeee]" />

        <div className="mx-auto mt-[20px] h-[16px] w-[620px] max-w-full rounded bg-[#f1f1f1]" />

        <div className="mx-auto mt-[30px] flex max-w-[620px] justify-center gap-3">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-[34px] w-[110px] rounded-full bg-[#eeeeee]"
              />
            )
          )}
        </div>

        <div className="mt-[76px] grid min-h-[430px] grid-cols-1 overflow-hidden rounded-[18px] border border-[#eeeeee] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#eeeeee]" />

          <div className="space-y-5 p-[52px]">
            <div className="h-[12px] w-[130px] rounded bg-[#eeeeee]" />
            <div className="h-[38px] w-full rounded bg-[#eeeeee]" />
            <div className="h-[16px] w-full rounded bg-[#f1f1f1]" />
            <div className="h-[16px] w-[85%] rounded bg-[#f1f1f1]" />
          </div>
        </div>

        <div className="mt-[74px] grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-[14px] border border-[#eeeeee]"
            >
              <div className="h-[255px] bg-[#eeeeee]" />

              <div className="space-y-4 p-[26px]">
                <div className="h-[20px] w-[85%] rounded bg-[#eeeeee]" />
                <div className="h-[14px] w-full rounded bg-[#f1f1f1]" />
                <div className="h-[14px] w-[75%] rounded bg-[#f1f1f1]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

const getInitials = (name) => {
  const words = String(name || "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
};

export default BlogPage;