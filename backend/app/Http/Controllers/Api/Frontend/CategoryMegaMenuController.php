<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryMegaMenuController extends Controller
{
    // Mega menu categories
    public function index()
    {
        $categories = Category::query()
            ->whereNull('parent_id')
            ->where('status', 1)
            ->with([
                'children' => function ($query) {
                    $query->where('status', 1)
                        ->orderBy('name');
                },
                'children.children' => function ($query) {
                    $query->where('status', 1)
                        ->orderBy('name');
                },
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => true,
            'categories' => $categories,
        ]);
    }

    // Update mega menu image
    public function updateImage(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($category->parent_id) {
            return response()->json([
                'status' => false,
                'message' => 'Mega menu image can only be assigned to a parent category.',
            ], 422);
        }

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $name = time() . '_' . $image->getClientOriginalName();

            $image->move(
                public_path('uploads/categories/mega-menu'),
                $name
            );

            $category->mega_menu_image = 'uploads/categories/mega-menu/' . $name;
            $category->save();
        }

        return response()->json([
            'status' => true,
            'message' => 'Mega menu image updated successfully.',
            'category' => $category->fresh(),
        ]);
    }
}