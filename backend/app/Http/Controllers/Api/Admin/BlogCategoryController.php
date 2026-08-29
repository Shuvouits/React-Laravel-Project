<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BlogCategory::query()
            ->withCount('posts');

        if ($request->filled('search')) {
            $search = trim(
                (string) $request->input('search')
            );

            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where(
                        'name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'slug',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');

            if ($status === 'active') {
                $query->where(
                    'is_active',
                    true
                );
            }

            if ($status === 'inactive') {
                $query->where(
                    'is_active',
                    false
                );
            }
        }

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

        $categories = $query
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage);

        $categories
            ->getCollection()
            ->transform(
                fn (BlogCategory $category) =>
                    $this->categoryData($category)
            );

        return response()->json([
            'success' => true,
            'categories' => $categories->items(),
            'pagination' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
                'from' => $categories->firstItem(),
                'to' => $categories->lastItem(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'slug' => $this->prepareSlug(
                $request->input('slug'),
                $request->input('name')
            ),
            'is_active' => $request->boolean(
                'is_active',
                true
            ),
        ]);

        $validated = $request->validate([
            'name' => [
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
                    'blog_categories',
                    'slug'
                ),
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
            'display_order' => [
                'nullable',
                'integer',
                'min:0',
                'max:999999',
            ],
        ]);

        $category = BlogCategory::query()->create([
            'name' => trim($validated['name']),
            'slug' => $validated['slug'],
            'description' => $this->nullableText(
                $validated['description'] ?? null
            ),
            'is_active' => $validated['is_active'],
            'display_order' => (int) (
                $validated['display_order'] ?? 0
            ),
        ]);

        $category->loadCount('posts');

        return response()->json([
            'success' => true,
            'message' => 'Blog category created successfully.',
            'category' => $this->categoryData($category),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = BlogCategory::query()
            ->withCount('posts')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'category' => $this->categoryData($category),
        ]);
    }

    public function update(
        Request $request,
        int $id
    ): JsonResponse {
        $category = BlogCategory::query()
            ->findOrFail($id);

        $request->merge([
            'slug' => $this->prepareSlug(
                $request->input('slug'),
                $request->input(
                    'name',
                    $category->name
                )
            ),
            'is_active' => $request->boolean(
                'is_active',
                $category->is_active
            ),
        ]);

        $validated = $request->validate([
            'name' => [
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
                    'blog_categories',
                    'slug'
                )->ignore($category->id),
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
            'display_order' => [
                'nullable',
                'integer',
                'min:0',
                'max:999999',
            ],
        ]);

        $category->update([
            'name' => trim($validated['name']),
            'slug' => $validated['slug'],
            'description' => $this->nullableText(
                $validated['description'] ?? null
            ),
            'is_active' => $validated['is_active'],
            'display_order' => (int) (
                $validated['display_order'] ?? 0
            ),
        ]);

        $category->loadCount('posts');

        return response()->json([
            'success' => true,
            'message' => 'Blog category updated successfully.',
            'category' => $this->categoryData($category),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = BlogCategory::query()
            ->withCount('posts')
            ->findOrFail($id);

        $categoryName = $category->name;
        $postCount = (int) $category->posts_count;

        /*
         * Pivot records will be deleted through database cascade.
         * Associated blog posts will not be deleted.
         */
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog category deleted successfully.',
            'deleted_category' => [
                'id' => $id,
                'name' => $categoryName,
                'detached_posts' => $postCount,
            ],
        ]);
    }

    private function categoryData(
        BlogCategory $category
    ): array {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'is_active' => (bool) $category->is_active,
            'display_order' => (int) $category->display_order,
            'posts_count' => (int) (
                $category->posts_count ?? 0
            ),
            'created_at' => $category->created_at,
            'updated_at' => $category->updated_at,
        ];
    }

    private function prepareSlug(
        mixed $slug,
        mixed $name
    ): string {
        $value = trim(
            (string) ($slug ?: $name)
        );

        return Str::slug($value);
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
}
