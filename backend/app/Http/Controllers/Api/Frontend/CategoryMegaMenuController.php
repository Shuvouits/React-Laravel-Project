<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CategoryMegaMenuController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->select($this->categoryColumns())
            ->whereNull('parent_id')
            ->where('status', 'active')
            ->where('display_order', '>', 0)
            ->with([
                'children' => function ($query) {
                    $query
                        ->select($this->categoryColumns())
                        ->where('status', 'active')
                        ->where('display_order', '>', 0)
                        ->orderBy('display_order')
                        ->orderBy('name');
                },

                'children.children' => function ($query) {
                    $query
                        ->select($this->categoryColumns())
                        ->where('status', 'active')
                        ->where('display_order', '>', 0)
                        ->orderBy('display_order')
                        ->orderBy('name');
                },
            ])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function (Category $category) {
                return $this->formatCategory($category);
            })
            ->values();

        return response()->json([
            'status' => true,
            'categories' => $categories,
        ]);
    }

    public function updateImage(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:5120',
            ],
        ]);

        $image = $validated['image'];

        $directory = public_path(
            'uploads/categories/mega-menu'
        );

        if (! File::exists($directory)) {
            File::makeDirectory(
                $directory,
                0755,
                true
            );
        }

        $originalName = pathinfo(
            $image->getClientOriginalName(),
            PATHINFO_FILENAME
        );

        $safeName = Str::slug($originalName);

        if ($safeName === '') {
            $safeName = 'category';
        }

        $extension = strtolower(
            $image->getClientOriginalExtension()
        );

        $fileName = time()
            . '-'
            . $category->id
            . '-'
            . $safeName
            . '-'
            . Str::lower(Str::random(8))
            . '.'
            . $extension;

        $relativePath = 'uploads/categories/mega-menu/'
            . $fileName;

        $image->move(
            $directory,
            $fileName
        );

        $oldImage = $category->mega_menu_image;

        $category->mega_menu_image = $relativePath;
        $category->save();

        $this->deleteOldImage(
            $oldImage,
            $relativePath
        );

        return response()->json([
            'status' => true,
            'message' => 'Mega menu image updated successfully.',
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'mega_menu_image' => $category->mega_menu_image,
                'mega_menu_image_url' => asset(
                    $category->mega_menu_image
                ),
            ],
        ]);
    }

    private function categoryColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'description',
            'image',
            'mega_menu_image',
            'parent_id',
            'status',
            'display_order',
        ];
    }

    private function formatCategory(
        Category $category,
        int $depth = 0
    ): array {
        $children = [];

        if ($depth < 2 && $category->relationLoaded('children')) {
            $children = $category->children
                ->filter(function (Category $child) {
                    return $child->status === 'active'
                        && (int) $child->display_order > 0;
                })
                ->sortBy(function (Category $child) {
                    return sprintf(
                        '%010d-%s',
                        (int) $child->display_order,
                        strtolower($child->name)
                    );
                })
                ->map(function (Category $child) use ($depth) {
                    return $this->formatCategory(
                        $child,
                        $depth + 1
                    );
                })
                ->values()
                ->all();
        }

        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'parent_id' => $category->parent_id,
            'display_order' => (int) $category->display_order,

            'image' => $category->image,
            'image_url' => $category->image
                ? asset($category->image)
                : null,

            'mega_menu_image' => $category->mega_menu_image,
            'mega_menu_image_url' => $category->mega_menu_image
                ? asset($category->mega_menu_image)
                : null,

            'children' => $children,
        ];
    }

    private function deleteOldImage(
        ?string $oldImage,
        string $newImage
    ): void {
        if (
            ! $oldImage ||
            $oldImage === $newImage
        ) {
            return;
        }

        $normalizedPath = ltrim(
            str_replace('\\', '/', $oldImage),
            '/'
        );

        if (
            ! Str::startsWith(
                $normalizedPath,
                'uploads/categories/mega-menu/'
            )
        ) {
            return;
        }

        $fullPath = public_path($normalizedPath);

        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
