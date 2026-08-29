<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\HomeSection;
use Illuminate\Http\JsonResponse;

class TopArticlesController extends Controller
{
    public function index(): JsonResponse
    {
        $section = HomeSection::query()
            ->where(
                'section_key',
                'top_articles'
            )
            ->first();

        if (
            !$section ||
            !$section->is_active
        ) {
            return response()->json([
                'success' => true,
                'active' => false,
                'section' => null,
                'articles' => [],
            ]);
        }

        $settings = is_array(
            $section->settings
        )
            ? $section->settings
            : [];

        $limit = min(
            max(
                (int) (
                    $settings['limit']
                    ?? 9
                ),
                1
            ),
            24
        );

        $desktopColumns = min(
            max(
                (int) (
                    $settings['desktop_columns']
                    ?? 4
                ),
                2
            ),
            4
        );

        $articles = BlogPost::query()
            ->with([
                'author:id,name,email',
                'categories:id,name,slug',
            ])
            ->where(
                'status',
                'published'
            )
            ->where(
                'visibility',
                'public'
            )
            ->where(function ($query) {
                $query
                    ->whereNull(
                        'published_at'
                    )
                    ->orWhere(
                        'published_at',
                        '<=',
                        now()
                    );
            })
            ->orderByDesc(
                'published_at'
            )
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function (
                BlogPost $post
            ) {
                return [
                    'id' =>
                        $post->id,

                    'title' =>
                        $post->title,

                    'slug' =>
                        $post->slug,

                    'excerpt' =>
                        $post->excerpt,

                    'featured_image_url' =>
                        $post->featured_image_url,

                    'featured_image_alt' =>
                        $post->featured_image_alt,

                    'published_at' =>
                        $post->published_at
                        ?? $post->created_at,

                    'author' =>
                        $post->author
                            ? [
                                'id' =>
                                    $post->author->id,

                                'name' =>
                                    $post->author->name,
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
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'active' => true,
            'section' => [
                'title' =>
                    $section->title
                    ?: 'Top Articles',

                'limit' =>
                    $limit,

                'desktop_columns' =>
                    $desktopColumns,
            ],
            'articles' =>
                $articles,
        ]);
    }
}
