<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'category' => [
                'nullable',
                'string',
                'max:150',
            ],
            'search' => [
                'nullable',
                'string',
                'max:150',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:24',
            ],
        ]);

        $categorySlug = trim(
            (string) $request->query(
                'category',
                ''
            )
        );

        $search = trim(
            (string) $request->query(
                'search',
                ''
            )
        );

        $perPage = min(
            max(
                (int) $request->query(
                    'per_page',
                    6
                ),
                1
            ),
            24
        );

        $categories = BlogCategory::query()
            ->active()
            ->ordered()
            ->withCount([
                'posts as posts_count' =>
                    function (Builder $query) {
                        $query->published();
                    },
            ])
            ->get([
                'id',
                'name',
                'slug',
                'description',
                'display_order',
            ])
            ->map(function (
                BlogCategory $category
            ) {
                return [
                    'id' =>
                        $category->id,

                    'name' =>
                        $category->name,

                    'slug' =>
                        $category->slug,

                    'description' =>
                        $category->description,

                    'posts_count' =>
                        (int) $category->posts_count,
                ];
            })
            ->values();

        $featuredQuery = BlogPost::query()
            ->published()
            ->with([
                'author',
                'categories:id,name,slug',
            ]);

        $this->applyCategoryFilter(
            $featuredQuery,
            $categorySlug
        );

        $this->applySearchFilter(
            $featuredQuery,
            $search
        );

        $featuredPost = $featuredQuery
            ->featured()
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->first();

        if (!$featuredPost) {
            $fallbackQuery = BlogPost::query()
                ->published()
                ->with([
                    'author',
                    'categories:id,name,slug',
                ]);

            $this->applyCategoryFilter(
                $fallbackQuery,
                $categorySlug
            );

            $this->applySearchFilter(
                $fallbackQuery,
                $search
            );

            $featuredPost = $fallbackQuery
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->first();
        }

        $postsQuery = BlogPost::query()
            ->published()
            ->with([
                'author',
                'categories:id,name,slug',
            ]);

        $this->applyCategoryFilter(
            $postsQuery,
            $categorySlug
        );

        $this->applySearchFilter(
            $postsQuery,
            $search
        );

        if ($featuredPost) {
            $postsQuery->where(
                'id',
                '!=',
                $featuredPost->id
            );
        }

        $posts = $postsQuery
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        $posts->through(
            fn (BlogPost $post) =>
                $this->formatPost(
                    $post,
                    false
                )
        );

        return response()->json([
            'status' => true,

            'filters' => [
                'category' =>
                    $categorySlug ?: null,

                'search' =>
                    $search ?: null,
            ],

            'categories' =>
                $categories,

            'featured_post' =>
                $featuredPost
                    ? $this->formatPost(
                        $featuredPost,
                        false
                    )
                    : null,

            'posts' =>
                $posts,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = BlogCategory::query()
            ->active()
            ->ordered()
            ->withCount([
                'posts as posts_count' =>
                    function (Builder $query) {
                        $query->published();
                    },
            ])
            ->get([
                'id',
                'name',
                'slug',
                'description',
                'display_order',
            ])
            ->map(function (
                BlogCategory $category
            ) {
                return [
                    'id' =>
                        $category->id,

                    'name' =>
                        $category->name,

                    'slug' =>
                        $category->slug,

                    'description' =>
                        $category->description,

                    'posts_count' =>
                        (int) $category->posts_count,
                ];
            })
            ->values();

        return response()->json([
            'status' => true,
            'categories' => $categories,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::query()
            ->published()
            ->with([
                'author',
                'categories:id,name,slug',
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        BlogPost::query()
            ->whereKey($post->id)
            ->increment('views_count');

        $post->views_count =
            (int) $post->views_count + 1;

        $categoryIds = $post
            ->categories
            ->pluck('id')
            ->all();

        $relatedQuery = BlogPost::query()
            ->published()
            ->with([
                'author',
                'categories:id,name,slug',
            ])
            ->where(
                'id',
                '!=',
                $post->id
            );

        if (!empty($categoryIds)) {
            $relatedQuery->whereHas(
                'categories',
                function (
                    Builder $query
                ) use ($categoryIds) {
                    $query->whereIn(
                        'blog_categories.id',
                        $categoryIds
                    );
                }
            );
        }

        $relatedPosts = $relatedQuery
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get()
            ->map(
                fn (BlogPost $relatedPost) =>
                    $this->formatPost(
                        $relatedPost,
                        false
                    )
            )
            ->values();

        return response()->json([
            'status' => true,

            'post' =>
                $this->formatPost(
                    $post,
                    true
                ),

            'related_posts' =>
                $relatedPosts,
        ]);
    }

    private function applyCategoryFilter(
        Builder $query,
        string $categorySlug
    ): void {
        if (!$categorySlug) {
            return;
        }

        $query->whereHas(
            'categories',
            function (
                Builder $categoryQuery
            ) use ($categorySlug) {
                $categoryQuery->where(
                    'blog_categories.slug',
                    $categorySlug
                );
            }
        );
    }

    private function applySearchFilter(
        Builder $query,
        string $search
    ): void {
        if (!$search) {
            return;
        }

        $query->where(
            function (
                Builder $searchQuery
            ) use ($search) {
                $searchQuery
                    ->where(
                        'title',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'excerpt',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'content',
                        'like',
                        "%{$search}%"
                    );
            }
        );
    }

    private function formatPost(
        BlogPost $post,
        bool $includeContent
    ): array {
        $publishedAt =
            $post->published_at
            ?? $post->created_at;

        $author = $post->author;

        $data = [
            'id' =>
                $post->id,

            'title' =>
                $post->title,

            'slug' =>
                $post->slug,

            'excerpt' =>
                $post->excerpt
                ?: Str::limit(
                    strip_tags(
                        (string) $post->content
                    ),
                    180
                ),

            'featured_image' =>
                $post->featured_image,

            'featured_image_url' =>
                $post->featured_image_url,

            'featured_image_alt' =>
                $post->featured_image_alt
                ?: $post->title,

            'is_featured' =>
                (bool) $post->is_featured,

            'allow_comments' =>
                (bool) $post->allow_comments,

            'tags' =>
                $post->tags ?: [],

            'views_count' =>
                (int) $post->views_count,

            'comments_count' =>
                (int) $post->comments_count,

            'published_at' =>
                $publishedAt?->toISOString(),

            'published_date' =>
                $publishedAt?->format(
                    'M d, Y'
                ),

            'author' =>
                $author
                    ? [
                        'id' =>
                            $author->id,

                        'name' =>
                            $this->getAuthorName(
                                $author
                            ),

                        'email' =>
                            $author->email,

                        'photo_url' =>
                            $this->getAuthorPhotoUrl(
                                $author
                            ),
                    ]
                    : null,

            'categories' =>
                $post->categories
                    ->map(
                        fn ($category) => [
                            'id' =>
                                $category->id,

                            'name' =>
                                $category->name,

                            'slug' =>
                                $category->slug,
                        ]
                    )
                    ->values()
                    ->all(),

            'seo' => [
                'title' =>
                    $post->seo_title
                    ?: $post->title,

                'meta_description' =>
                    $post->meta_description
                    ?: $post->excerpt,
            ],
        ];

        if ($includeContent) {
            $data['content'] =
                $post->content;
        }

        return $data;
    }

    private function getAuthorName(
        object $author
    ): string {
        if (!empty($author->name)) {
            return $author->name;
        }

        $name = trim(
            implode(
                ' ',
                array_filter([
                    $author->first_name
                        ?? null,

                    $author->middle_name
                        ?? null,

                    $author->last_name
                        ?? null,
                ])
            )
        );

        return $name ?: 'Storify Admin';
    }

    private function getAuthorPhotoUrl(
        object $author
    ): ?string {
        $photo =
            $author->photo_url
            ?? $author->avatar_url
            ?? $author->profile_photo_url
            ?? $author->photo
            ?? $author->avatar
            ?? $author->profile_photo
            ?? null;

        if (!$photo) {
            return null;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            ) ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return $photo;
        }

        return asset(
            ltrim(
                $photo,
                '/'
            )
        );
    }
}