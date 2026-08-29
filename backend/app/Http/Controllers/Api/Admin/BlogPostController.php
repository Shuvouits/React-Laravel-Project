<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BlogPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::query()
            ->with([
                'author:id,name,email',
                'categories:id,name,slug',
            ]);

        $this->applyFilters(
            $query,
            $request
        );

        $sortDirection =
            $request->input('sort') === 'asc'
                ? 'asc'
                : 'desc';

        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    20
                ),
                1
            ),
            100
        );

        $posts = $query
            ->orderBy(
                'created_at',
                $sortDirection
            )
            ->orderBy(
                'id',
                $sortDirection
            )
            ->paginate($perPage);

        $posts
            ->getCollection()
            ->transform(
                fn (BlogPost $post) =>
                    $this->postListData($post)
            );

        return response()->json([
            'success' => true,
            'posts' => $posts->items(),
            'stats' => $this->stats(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'from' => $posts->firstItem(),
                'to' => $posts->lastItem(),
            ],
        ]);
    }

    public function formOptions(): JsonResponse
    {
        $categories = BlogCategory::query()
            ->active()
            ->ordered()
            ->get([
                'id',
                'name',
                'slug',
            ]);

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'statuses' => [
                [
                    'value' => 'draft',
                    'label' => 'Draft',
                ],
                [
                    'value' => 'published',
                    'label' => 'Published',
                ],
                [
                    'value' => 'scheduled',
                    'label' => 'Scheduled',
                ],
                [
                    'value' => 'archived',
                    'label' => 'Archived',
                ],
            ],
            'visibilities' => [
                [
                    'value' => 'public',
                    'label' => 'Public',
                ],
                [
                    'value' => 'private',
                    'label' => 'Private',
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeRequest($request);

        $validated = $this->validatePost(
            $request
        );

        $post = DB::transaction(
            function () use (
                $request,
                $validated
            ) {
                $featuredImage = null;

                if (
                    $request->hasFile(
                        'featured_image'
                    )
                ) {
                    $featuredImage =
                        $this->storeFeaturedImage(
                            $request->file(
                                'featured_image'
                            )
                        );
                }

                $dates = $this->statusDates(
                    $validated['status'],
                    $validated['scheduled_at']
                        ?? null
                );

                $post = BlogPost::query()->create([
                    'author_id' =>
                        $request->user()?->id,
                    'title' => trim(
                        $validated['title']
                    ),
                    'slug' =>
                        $validated['slug'],
                    'excerpt' =>
                        $this->nullableText(
                            $validated['excerpt']
                                ?? null
                        ),
                    'content' =>
                        $validated['content'],
                    'featured_image' =>
                        $featuredImage,
                    'featured_image_alt' =>
                        $this->nullableText(
                            $validated[
                                'featured_image_alt'
                            ] ?? null
                        ),
                    'status' =>
                        $validated['status'],
                    'visibility' =>
                        $validated['visibility'],
                    'is_featured' =>
                        $validated['is_featured'],
                    'allow_comments' =>
                        $validated['allow_comments'],
                    'tags' =>
                        $validated['tags'] ?? [],
                    'seo_title' =>
                        $this->nullableText(
                            $validated['seo_title']
                                ?? null
                        ),
                    'meta_description' =>
                        $this->nullableText(
                            $validated[
                                'meta_description'
                            ] ?? null
                        ),
                    'published_at' =>
                        $dates['published_at'],
                    'scheduled_at' =>
                        $dates['scheduled_at'],
                    'archived_at' =>
                        $dates['archived_at'],
                ]);

                $post->categories()->sync(
                    $validated['category_ids']
                        ?? []
                );

                return $post;
            },
            3
        );

        $post->load([
            'author:id,name,email',
            'categories:id,name,slug',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Blog post created successfully.',
            'post' => $this->postDetailsData(
                $post
            ),
        ], 201);
    }

    public function show(
        int $id
    ): JsonResponse {
        $post = BlogPost::query()
            ->with([
                'author:id,name,email',
                'categories:id,name,slug',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'post' => $this->postDetailsData(
                $post
            ),
        ]);
    }

    public function update(
        Request $request,
        int $id
    ): JsonResponse {
        $post = BlogPost::query()
            ->findOrFail($id);

        $this->normalizeRequest(
            $request,
            $post
        );

        $validated = $this->validatePost(
            $request,
            $post
        );

        $oldImage = $post->featured_image;
        $newImage = null;

        DB::transaction(
            function () use (
                $request,
                $validated,
                $post,
                &$newImage
            ) {
                $featuredImage =
                    $post->featured_image;

                if (
                    $request->boolean(
                        'remove_featured_image'
                    )
                ) {
                    $featuredImage = null;
                }

                if (
                    $request->hasFile(
                        'featured_image'
                    )
                ) {
                    $newImage =
                        $this->storeFeaturedImage(
                            $request->file(
                                'featured_image'
                            )
                        );

                    $featuredImage = $newImage;
                }

                $dates = $this->statusDates(
                    $validated['status'],
                    $validated['scheduled_at']
                        ?? null,
                    $post
                );

                $post->update([
                    'title' => trim(
                        $validated['title']
                    ),
                    'slug' =>
                        $validated['slug'],
                    'excerpt' =>
                        $this->nullableText(
                            $validated['excerpt']
                                ?? null
                        ),
                    'content' =>
                        $validated['content'],
                    'featured_image' =>
                        $featuredImage,
                    'featured_image_alt' =>
                        $this->nullableText(
                            $validated[
                                'featured_image_alt'
                            ] ?? null
                        ),
                    'status' =>
                        $validated['status'],
                    'visibility' =>
                        $validated['visibility'],
                    'is_featured' =>
                        $validated['is_featured'],
                    'allow_comments' =>
                        $validated['allow_comments'],
                    'tags' =>
                        $validated['tags'] ?? [],
                    'seo_title' =>
                        $this->nullableText(
                            $validated['seo_title']
                                ?? null
                        ),
                    'meta_description' =>
                        $this->nullableText(
                            $validated[
                                'meta_description'
                            ] ?? null
                        ),
                    'published_at' =>
                        $dates['published_at'],
                    'scheduled_at' =>
                        $dates['scheduled_at'],
                    'archived_at' =>
                        $dates['archived_at'],
                ]);

                $post->categories()->sync(
                    $validated['category_ids']
                        ?? []
                );
            },
            3
        );

        if (
            (
                $newImage ||
                $request->boolean(
                    'remove_featured_image'
                )
            ) &&
            $oldImage &&
            $oldImage !== $post->featured_image
        ) {
            $this->deleteFeaturedImage(
                $oldImage
            );
        }

        $post->load([
            'author:id,name,email',
            'categories:id,name,slug',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Blog post updated successfully.',
            'post' => $this->postDetailsData(
                $post->fresh([
                    'author',
                    'categories',
                ])
            ),
        ]);
    }

    public function destroy(
        int $id
    ): JsonResponse {
        $post = BlogPost::query()
            ->findOrFail($id);

        $postTitle = $post->title;
        $featuredImage =
            $post->featured_image;

        DB::transaction(function () use ($post) {
            $post->categories()->detach();
            $post->delete();
        });

        $this->deleteFeaturedImage(
            $featuredImage
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Blog post deleted successfully.',
            'deleted_post' => [
                'id' => $id,
                'title' => $postTitle,
            ],
        ]);
    }

    private function applyFilters(
        Builder $query,
        Request $request
    ): void {
        if ($request->filled('search')) {
            $search = trim(
                (string) $request->input(
                    'search'
                )
            );

            $query->where(
                function (
                    Builder $subQuery
                ) use ($search) {
                    $subQuery
                        ->where(
                            'title',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'slug',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'excerpt',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        $tab = $request->input(
            'tab',
            'all'
        );

        if (
            in_array(
                $tab,
                [
                    'draft',
                    'published',
                    'scheduled',
                    'archived',
                ],
                true
            )
        ) {
            $query->where(
                'status',
                $tab
            );
        }

        if ($request->filled('category_id')) {
            $categoryId = (int) $request->input(
                'category_id'
            );

            $query->whereHas(
                'categories',
                fn (Builder $categoryQuery) =>
                    $categoryQuery->where(
                        'blog_categories.id',
                        $categoryId
                    )
            );
        }

        if ($request->filled('visibility')) {
            $visibility =
                $request->input(
                    'visibility'
                );

            if (
                in_array(
                    $visibility,
                    [
                        'public',
                        'private',
                    ],
                    true
                )
            ) {
                $query->where(
                    'visibility',
                    $visibility
                );
            }
        }
    }

    private function normalizeRequest(
        Request $request,
        ?BlogPost $post = null
    ): void {
        $request->merge([
            'slug' => Str::slug(
                (string) (
                    $request->input('slug')
                    ?: $request->input(
                        'title',
                        $post?->title
                    )
                )
            ),
            'is_featured' =>
                $request->boolean(
                    'is_featured',
                    $post?->is_featured
                        ?? false
                ),
            'allow_comments' =>
                $request->boolean(
                    'allow_comments',
                    $post?->allow_comments
                        ?? true
                ),
            'category_ids' =>
                $this->normalizeIntegerArray(
                    $request->input(
                        'category_ids',
                        []
                    )
                ),
            'tags' =>
                $this->normalizeStringArray(
                    $request->input(
                        'tags',
                        []
                    )
                ),
        ]);
    }

    private function validatePost(
        Request $request,
        ?BlogPost $post = null
    ): array {
        return $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique(
                    'blog_posts',
                    'slug'
                )->ignore($post?->id),
            ],
            'excerpt' => [
                'nullable',
                'string',
                'max:500',
            ],
            'content' => [
                'required',
                'string',
            ],
            'featured_image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:5120',
            ],
            'featured_image_alt' => [
                'nullable',
                'string',
                'max:255',
            ],
            'remove_featured_image' => [
                'nullable',
                'boolean',
            ],
            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'published',
                    'scheduled',
                    'archived',
                ]),
            ],
            'visibility' => [
                'required',
                Rule::in([
                    'public',
                    'private',
                ]),
            ],
            'is_featured' => [
                'required',
                'boolean',
            ],
            'allow_comments' => [
                'required',
                'boolean',
            ],
            'category_ids' => [
                'nullable',
                'array',
            ],
            'category_ids.*' => [
                'integer',
                Rule::exists(
                    'blog_categories',
                    'id'
                ),
            ],
            'tags' => [
                'nullable',
                'array',
                'max:30',
            ],
            'tags.*' => [
                'string',
                'max:60',
            ],
            'seo_title' => [
                'nullable',
                'string',
                'max:70',
            ],
            'meta_description' => [
                'nullable',
                'string',
                'max:320',
            ],
            'scheduled_at' => [
                Rule::requiredIf(
                    $request->input(
                        'status'
                    ) === 'scheduled'
                ),
                'nullable',
                'date',
            ],
        ]);
    }

    private function statusDates(
        string $status,
        mixed $scheduledAt = null,
        ?BlogPost $post = null
    ): array {
        if ($status === 'published') {
            return [
                'published_at' =>
                    $post?->published_at
                    ?: now(),
                'scheduled_at' => null,
                'archived_at' => null,
            ];
        }

        if ($status === 'scheduled') {
            $scheduledDate = now()->parse(
                $scheduledAt
            );

            if ($scheduledDate->lte(now())) {
                throw ValidationException::withMessages([
                    'scheduled_at' => [
                        'Scheduled date must be in the future.',
                    ],
                ]);
            }

            return [
                'published_at' => null,
                'scheduled_at' =>
                    $scheduledDate,
                'archived_at' => null,
            ];
        }

        if ($status === 'archived') {
            return [
                'published_at' =>
                    $post?->published_at,
                'scheduled_at' => null,
                'archived_at' =>
                    $post?->archived_at
                    ?: now(),
            ];
        }

        return [
            'published_at' => null,
            'scheduled_at' => null,
            'archived_at' => null,
        ];
    }

    private function storeFeaturedImage(
        mixed $image
    ): string {
        $directory =
            'uploads/blog/posts/'
            . now()->format('Y/m');

        $absoluteDirectory =
            public_path($directory);

        if (
            !File::isDirectory(
                $absoluteDirectory
            )
        ) {
            File::makeDirectory(
                $absoluteDirectory,
                0755,
                true
            );
        }

        $extension = strtolower(
            $image->getClientOriginalExtension()
        );

        $filename =
            now()->format('YmdHis')
            . '-'
            . Str::lower(
                Str::random(12)
            )
            . '.'
            . $extension;

        $image->move(
            $absoluteDirectory,
            $filename
        );

        return $directory
            . '/'
            . $filename;
    }

    private function deleteFeaturedImage(
        ?string $path
    ): void {
        if (!$path) {
            return;
        }

        if (
            str_starts_with(
                $path,
                'http://'
            ) ||
            str_starts_with(
                $path,
                'https://'
            )
        ) {
            return;
        }

        $absolutePath = public_path(
            ltrim($path, '/')
        );

        if (
            File::exists(
                $absolutePath
            )
        ) {
            File::delete(
                $absolutePath
            );
        }
    }

    private function normalizeIntegerArray(
        mixed $values
    ): array {
        if (is_string($values)) {
            $decoded = json_decode(
                $values,
                true
            );

            if (
                json_last_error()
                === JSON_ERROR_NONE
            ) {
                $values = $decoded;
            }
        }

        if (!is_array($values)) {
            return [];
        }

        return array_values(
            array_unique(
                array_filter(
                    array_map(
                        'intval',
                        $values
                    ),
                    fn (int $value) =>
                        $value > 0
                )
            )
        );
    }

    private function normalizeStringArray(
        mixed $values
    ): array {
        if (is_string($values)) {
            $decoded = json_decode(
                $values,
                true
            );

            $values =
                json_last_error()
                === JSON_ERROR_NONE
                    ? $decoded
                    : explode(',', $values);
        }

        if (!is_array($values)) {
            return [];
        }

        return array_values(
            array_unique(
                array_filter(
                    array_map(
                        fn ($value) =>
                            trim(
                                (string) $value
                            ),
                        $values
                    )
                )
            )
        );
    }

    private function nullableText(
        mixed $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        $value = trim(
            (string) $value
        );

        return $value !== ''
            ? $value
            : null;
    }

    private function stats(): array
    {
        return [
            'total' =>
                BlogPost::query()->count(),
            'published' =>
                BlogPost::query()
                    ->where(
                        'status',
                        'published'
                    )
                    ->count(),
            'drafts' =>
                BlogPost::query()
                    ->where(
                        'status',
                        'draft'
                    )
                    ->count(),
            'scheduled' =>
                BlogPost::query()
                    ->where(
                        'status',
                        'scheduled'
                    )
                    ->count(),
            'archived' =>
                BlogPost::query()
                    ->where(
                        'status',
                        'archived'
                    )
                    ->count(),
            'total_views' =>
                (int) BlogPost::query()
                    ->sum('views_count'),
        ];
    }

    private function postListData(
        BlogPost $post
    ): array {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'featured_image' =>
                $post->featured_image,
            'featured_image_url' =>
                $post->featured_image_url,
            'featured_image_alt' =>
                $post->featured_image_alt,
            'status' => $post->status,
            'visibility' =>
                $post->visibility,
            'is_featured' =>
                (bool) $post->is_featured,
            'allow_comments' =>
                (bool) $post->allow_comments,
            'views_count' =>
                (int) $post->views_count,
            'comments_count' =>
                (int) $post->comments_count,
            'author' => $post->author
                ? [
                    'id' =>
                        $post->author->id,
                    'name' =>
                        $post->author->name,
                    'email' =>
                        $post->author->email,
                ]
                : null,
            'categories' =>
                $post->categories
                    ->map(
                        fn (BlogCategory $category) => [
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
            'published_at' =>
                $post->published_at,
            'scheduled_at' =>
                $post->scheduled_at,
            'archived_at' =>
                $post->archived_at,
            'created_at' =>
                $post->created_at,
            'updated_at' =>
                $post->updated_at,
        ];
    }

    private function postDetailsData(
        BlogPost $post
    ): array {
        return array_merge(
            $this->postListData($post),
            [
                'content' =>
                    $post->content,
                'tags' =>
                    $post->tags ?? [],
                'seo_title' =>
                    $post->seo_title,
                'meta_description' =>
                    $post->meta_description,
                'category_ids' =>
                    $post->categories
                        ->pluck('id')
                        ->map(
                            fn ($id) =>
                                (int) $id
                        )
                        ->values()
                        ->all(),
            ]
        );
    }
}