<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Collection;

class CollectionMenuController extends Controller
{
    // Collection menu
    public function index()
    {
        $collections = Collection::query()
            ->where('status', 'active')
            ->where('online_store', true)
            ->orderBy('display_position', 'asc')
            ->orderBy('title', 'asc')
            ->limit(12)
            ->get();

        $collections = $collections->map(function ($collection) {
            return [
                'id' => $collection->id,
                'title' => $collection->title,
                'slug' => $collection->slug,
                'description' => $collection->description,
                'image' => $collection->image,
                'collection_type' => $collection->collection_type,
                'display_position' => $collection->display_position,
            ];
        });

        return response()->json([
            'status' => true,
            'collections' => $collections,
        ]);
    }
}
