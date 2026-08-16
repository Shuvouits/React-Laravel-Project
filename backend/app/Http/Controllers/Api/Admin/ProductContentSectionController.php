<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductContentSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductContentSectionController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $sections = $product->contentSections()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'sections' => $sections,
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'is_enabled' => ['nullable', 'boolean'],
        ]);

        $nextSortOrder = (int) $product->contentSections()->max('sort_order') + 1;

        $section = $product->contentSections()->create([
            'title' => trim($validated['title']),
            'content' => $validated['content'] ?? null,
            'sort_order' => $nextSortOrder,
            'is_enabled' => $validated['is_enabled'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product section created successfully.',
            'section' => $section,
        ], 201);
    }

    public function update(
        Request $request,
        Product $product,
        ProductContentSection $section
    ): JsonResponse {
        if ((int) $section->product_id !== (int) $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Product section not found.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'is_enabled' => ['nullable', 'boolean'],
        ]);

        $section->update([
            'title' => trim($validated['title']),
            'content' => $validated['content'] ?? null,
            'is_enabled' => $validated['is_enabled'] ?? $section->is_enabled,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product section updated successfully.',
            'section' => $section->fresh(),
        ]);
    }

    public function destroy(
        Product $product,
        ProductContentSection $section
    ): JsonResponse {
        if ((int) $section->product_id !== (int) $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Product section not found.',
            ], 404);
        }

        $section->delete();

        $this->normalizeSortOrder($product);

        return response()->json([
            'success' => true,
            'message' => 'Product section deleted successfully.',
        ]);
    }

    public function reorder(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.id' => ['required', 'integer'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $sectionIds = collect($validated['sections'])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $validSectionIds = $product->contentSections()
            ->whereIn('id', $sectionIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($sectionIds->sort()->values()->all() !== $validSectionIds->sort()->values()->all()) {
            return response()->json([
                'success' => false,
                'message' => 'One or more product sections are invalid.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $product) {
            foreach ($validated['sections'] as $item) {
                $product->contentSections()
                    ->where('id', $item['id'])
                    ->update([
                        'sort_order' => $item['sort_order'],
                    ]);
            }
        });

        $sections = $product->contentSections()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Product sections reordered successfully.',
            'sections' => $sections,
        ]);
    }

    private function normalizeSortOrder(Product $product): void
    {
        $sections = $product->contentSections()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        foreach ($sections as $index => $section) {
            $section->update([
                'sort_order' => $index + 1,
            ]);
        }
    }
}