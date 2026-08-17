<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\ProductReviewImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ProductReviewController extends Controller
{
    public function index(
        Request $request,
        Product $product
    ): JsonResponse {
        $sort = $request->query(
            'sort',
            'recent'
        );

        $perPage = min(
            max(
                (int) $request->query(
                    'per_page',
                    10
                ),
                1
            ),
            50
        );

        $query = ProductReview::query()
            ->where(
                'product_id',
                $product->id
            )
            ->where(
                'status',
                'approved'
            )
            ->where(
                'is_on_hold',
                false
            )
            ->with([
                'user',
                'images',
            ]);

        switch ($sort) {
            case 'highest':
                $query
                    ->orderByDesc('rating')
                    ->orderByDesc('created_at');
                break;

            case 'lowest':
                $query
                    ->orderBy('rating')
                    ->orderByDesc('created_at');
                break;

            case 'oldest':
                $query
                    ->orderBy('created_at');
                break;

            default:
                $query
                    ->orderByDesc('created_at');
                break;
        }

        $reviews = $query
            ->paginate($perPage);

        $reviews
            ->getCollection()
            ->transform(
                function ($review) {
                    return $this->transformReview(
                        $review
                    );
                }
            );

        return response()->json([
            'success' => true,

            'summary' =>
                $this->getReviewSummary(
                    $product->id
                ),

            'reviews' =>
                $reviews,
        ]);
    }

    public function store(
        Request $request,
        Product $product
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,

                'message' =>
                    'You must be logged in to write a review.',
            ], 401);
        }

        $validated = $request->validate([
            'rating' => [
                'required',
                'integer',
                'between:1,5',
            ],

            'title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'review' => [
                'required',
                'string',
                'max:1000',
            ],

            'images' => [
                'nullable',
                'array',
                'max:4',
            ],

            'images.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
        ]);

        $existingReview =
            ProductReview::query()
                ->where(
                    'product_id',
                    $product->id
                )
                ->where(
                    'user_id',
                    $user->id
                )
                ->exists();

        if ($existingReview) {
            return response()->json([
                'success' => false,

                'message' =>
                    'You have already reviewed this product.',
            ], 422);
        }

        $review = DB::transaction(
            function () use (
                $request,
                $validated,
                $product,
                $user
            ) {
                $review =
                    ProductReview::create([
                        'product_id' =>
                            $product->id,

                        'user_id' =>
                            $user->id,

                        'rating' =>
                            $validated['rating'],

                        'title' =>
                            $validated['title']
                            ?? null,

                        'review' =>
                            $validated['review'],

                        'status' =>
                            'approved',

                        'is_on_hold' =>
                            false,

                        'is_verified_purchase' =>
                            false,

                        'approved_at' =>
                            now(),
                    ]);

                /*
                |--------------------------------------------------------------------------
                | REVIEW IMAGES
                |--------------------------------------------------------------------------
                */

                if (
                    $request->hasFile(
                        'images'
                    )
                ) {
                    $uploadDirectory =
                        public_path(
                            'uploads/product-reviews'
                        );

                    if (
                        !File::exists(
                            $uploadDirectory
                        )
                    ) {
                        File::makeDirectory(
                            $uploadDirectory,
                            0755,
                            true
                        );
                    }

                    foreach (
                        $request->file(
                            'images'
                        ) as $index => $image
                    ) {
                        $extension =
                            strtolower(
                                $image
                                    ->getClientOriginalExtension()
                            );

                        $fileName =
                            Str::uuid()
                            . '.'
                            . $extension;

                        $image->move(
                            $uploadDirectory,
                            $fileName
                        );

                        ProductReviewImage::create([
                            'product_review_id' =>
                                $review->id,

                            'image_path' =>
                                'uploads/product-reviews/'
                                . $fileName,

                            'sort_order' =>
                                $index,
                        ]);
                    }
                }

                return $review;
            }
        );

        $review->load([
            'user',
            'images',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Your review has been submitted successfully.',

            'review' =>
                $this->transformReview(
                    $review
                ),

            'summary' =>
                $this->getReviewSummary(
                    $product->id
                ),
        ], 201);
    }

    private function getReviewSummary(
        int $productId
    ): array {
        $baseQuery =
            ProductReview::query()
                ->where(
                    'product_id',
                    $productId
                )
                ->where(
                    'status',
                    'approved'
                )
                ->where(
                    'is_on_hold',
                    false
                );

        $totalReviews =
            (clone $baseQuery)
                ->count();

        $averageRating =
            $totalReviews > 0
                ? round(
                    (float) (
                        clone $baseQuery
                    )->avg('rating'),
                    1
                )
                : 0;

        $ratingCounts = [];

        for (
            $rating = 5;
            $rating >= 1;
            $rating--
        ) {
            $ratingCounts[$rating] =
                (clone $baseQuery)
                    ->where(
                        'rating',
                        $rating
                    )
                    ->count();
        }

        $recommendedCount =
            (clone $baseQuery)
                ->where(
                    'rating',
                    '>=',
                    4
                )
                ->count();

        $recommendationPercentage =
            $totalReviews > 0
                ? round(
                    (
                        $recommendedCount /
                        $totalReviews
                    ) * 100
                )
                : 0;

        return [
            'average_rating' =>
                $averageRating,

            'total_reviews' =>
                $totalReviews,

            'rating_counts' => [
                '5' =>
                    $ratingCounts[5],

                '4' =>
                    $ratingCounts[4],

                '3' =>
                    $ratingCounts[3],

                '2' =>
                    $ratingCounts[2],

                '1' =>
                    $ratingCounts[1],
            ],

            'recommended_count' =>
                $recommendedCount,

            'recommendation_percentage' =>
                $recommendationPercentage,
        ];
    }

    private function transformReview(
        ProductReview $review
    ): array {
        $user =
            $review->user;

        $reviewerName =
            $user?->name;

        if (
            !$reviewerName &&
            $user
        ) {
            $reviewerName =
                trim(
                    implode(
                        ' ',
                        array_filter([
                            $user->first_name
                            ?? null,

                            $user->last_name
                            ?? null,
                        ])
                    )
                );
        }

        if (!$reviewerName) {
            $reviewerName =
                'Customer';
        }

        return [
            'id' =>
                $review->id,

            'rating' =>
                (int)
                $review->rating,

            'title' =>
                $review->title,

            'review' =>
                $review->review,

            'reviewer' => [
                'id' =>
                    $user?->id,

                'name' =>
                    $reviewerName,

                'avatar_url' =>
                    $this->getUserAvatar(
                        $user
                    ),
            ],

            'is_verified_purchase' =>
                (bool)
                $review->is_verified_purchase,

            'helpful_count' =>
                (int)
                $review->helpful_count,

            'images' =>
                $review->images
                    ->map(
                        function ($image) {
                            return [
                                'id' =>
                                    $image->id,

                                'url' =>
                                    $this
                                        ->getReviewImageUrl(
                                            $image
                                                ->image_path
                                        ),
                            ];
                        }
                    )
                    ->values(),

            'created_at' =>
                $review->created_at,

            'created_at_formatted' =>
                $review->created_at
                    ?->format(
                        'M d, Y'
                    ),
        ];
    }

    private function getUserAvatar(
        $user
    ): ?string {
        if (!$user) {
            return null;
        }

        $photo =
            $user->photo
            ?? null;

        if (!$photo) {
            return null;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            )
            ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return $photo;
        }

        return
            request()
                ->getSchemeAndHttpHost()
            . '/'
            . ltrim(
                $photo,
                '/'
            );
    }

    private function getReviewImageUrl(
        ?string $path
    ): ?string {
        if (!$path) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | ALREADY FULL URL
        |--------------------------------------------------------------------------
        */

        if (
            str_starts_with(
                $path,
                'http://'
            )
            ||
            str_starts_with(
                $path,
                'https://'
            )
        ) {
            return $path;
        }

        $baseUrl =
            request()
                ->getSchemeAndHttpHost();

        $cleanPath =
            ltrim(
                $path,
                '/'
            );

        /*
        |--------------------------------------------------------------------------
        | NEW PUBLIC UPLOAD PATH
        |--------------------------------------------------------------------------
        |
        | uploads/product-reviews/image.webp
        |
        */

        if (
            str_starts_with(
                $cleanPath,
                'uploads/'
            )
        ) {
            return
                $baseUrl
                . '/'
                . $cleanPath;
        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING STORAGE URL
        |--------------------------------------------------------------------------
        |
        | storage/product-reviews/image.webp
        |
        */

        if (
            str_starts_with(
                $cleanPath,
                'storage/'
            )
        ) {
            return
                $baseUrl
                . '/'
                . $cleanPath;
        }

        /*
        |--------------------------------------------------------------------------
        | LEGACY REVIEW IMAGE
        |--------------------------------------------------------------------------
        |
        | Old database:
        | product-reviews/image.webp
        |
        | Physical:
        | storage/app/public/product-reviews/image.webp
        |
        */

        if (
            str_starts_with(
                $cleanPath,
                'product-reviews/'
            )
        ) {
            return
                $baseUrl
                . '/storage/'
                . $cleanPath;
        }

        return
            $baseUrl
            . '/'
            . $cleanPath;
    }
}