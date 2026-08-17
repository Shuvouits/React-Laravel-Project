<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class AdminReviewController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $tab = $request->query(
            'tab',
            'all'
        );

        $search = trim(
            (string) $request->query(
                'search',
                ''
            )
        );

        $rating = $request->query(
            'rating'
        );

        $sort = $request->query(
            'sort',
            'recent'
        );

        $perPage = min(
            max(
                (int) $request->query(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $allowedTabs = [
            'all',
            'published',
            'on_hold',
            'replied',
            'awaiting_reply',
        ];

        if (!in_array(
            $tab,
            $allowedTabs,
            true
        )) {
            $tab = 'all';
        }

        $query = ProductReview::query()
            ->with([
                'product.media',
                'user',
                'images',
                'repliedBy',
                'heldBy',
            ]);

        $this->applyTabFilter(
            $query,
            $tab
        );

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'title',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'review',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhereHas(
                            'product',
                            function ($productQuery) use ($search) {
                                $productQuery
                                    ->where(
                                        'title',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'slug',
                                        'like',
                                        '%' . $search . '%'
                                    );
                            }
                        )
                        ->orWhereHas(
                            'user',
                            function ($userQuery) use ($search) {
                                $userQuery
                                    ->where(
                                        'name',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'first_name',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'last_name',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'email',
                                        'like',
                                        '%' . $search . '%'
                                    );
                            }
                        );
                }
            );
        }

        if (
            $rating !== null &&
            $rating !== ''
        ) {
            $rating = (int) $rating;

            if (
                $rating >= 1 &&
                $rating <= 5
            ) {
                $query->where(
                    'rating',
                    $rating
                );
            }
        }

        switch ($sort) {
            case 'oldest':
                $query->orderBy(
                    'created_at',
                    'asc'
                );
                break;

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

            default:
                $query->orderByDesc(
                    'created_at'
                );
                break;
        }

        $reviews = $query->paginate(
            $perPage
        );

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
                $this->getSummary(),

            'tab_counts' =>
                $this->getTabCounts(),

            'reviews' =>
                $reviews,
        ]);
    }

    public function show(
        ProductReview $productReview
    ): JsonResponse {
        $productReview->load([
            'product.media',
            'user',
            'images',
            'repliedBy',
            'heldBy',
        ]);

        return response()->json([
            'success' => true,

            'review' =>
                $this->transformReview(
                    $productReview
                ),
        ]);
    }

    public function publish(
        Request $request,
        ProductReview $productReview
    ): JsonResponse {
        DB::transaction(
            function () use (
                $productReview
            ) {
                $productReview->update([
                    'status' =>
                        'approved',

                    'is_on_hold' =>
                        false,

                    'held_by' =>
                        null,

                    'held_at' =>
                        null,

                    'hold_reason' =>
                        null,

                    'approved_at' =>
                        $productReview->approved_at
                            ?: now(),
                ]);
            }
        );

        return $this->reviewActionResponse(
            $productReview,
            'Review published successfully.'
        );
    }

    public function hold(
        Request $request,
        ProductReview $productReview
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        DB::transaction(
            function () use (
                $request,
                $validated,
                $productReview
            ) {
                $productReview->update([
                    'is_on_hold' =>
                        true,

                    'held_by' =>
                        $request->user()?->id,

                    'held_at' =>
                        now(),

                    'hold_reason' =>
                        $validated['reason']
                        ?? null,
                ]);
            }
        );

        return $this->reviewActionResponse(
            $productReview,
            'Review placed on hold successfully.'
        );
    }

    public function releaseHold(
        ProductReview $productReview
    ): JsonResponse {
        $productReview->update([
            'is_on_hold' =>
                false,

            'held_by' =>
                null,

            'held_at' =>
                null,

            'hold_reason' =>
                null,
        ]);

        return $this->reviewActionResponse(
            $productReview,
            'Review removed from hold successfully.'
        );
    }

    public function reply(
        Request $request,
        ProductReview $productReview
    ): JsonResponse {
        $validated = $request->validate([
            'reply' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        DB::transaction(
            function () use (
                $request,
                $validated,
                $productReview
            ) {
                $productReview->update([
                    'admin_reply' =>
                        trim(
                            $validated['reply']
                        ),

                    'replied_by' =>
                        $request->user()?->id,

                    'replied_at' =>
                        now(),
                ]);
            }
        );

        return $this->reviewActionResponse(
            $productReview,
            'Reply saved successfully.'
        );
    }

    public function deleteReply(
        ProductReview $productReview
    ): JsonResponse {
        $productReview->update([
            'admin_reply' =>
                null,

            'replied_by' =>
                null,

            'replied_at' =>
                null,
        ]);

        return $this->reviewActionResponse(
            $productReview,
            'Reply removed successfully.'
        );
    }

    public function reject(
        ProductReview $productReview
    ): JsonResponse {
        $productReview->update([
            'status' =>
                'rejected',

            'is_on_hold' =>
                false,

            'held_by' =>
                null,

            'held_at' =>
                null,

            'hold_reason' =>
                null,
        ]);

        return $this->reviewActionResponse(
            $productReview,
            'Review rejected successfully.'
        );
    }

    public function destroy(
        ProductReview $productReview
    ): JsonResponse {
        $productReview->load(
            'images'
        );

        DB::transaction(
            function () use (
                $productReview
            ) {
                foreach (
                    $productReview->images
                    as $image
                ) {
                    $this->deleteReviewImage(
                        $image->image_path
                    );
                }

                $productReview->delete();
            }
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Review deleted successfully.',
        ]);
    }

    private function applyTabFilter(
        $query,
        string $tab
    ): void {
        if ($tab === 'published') {
            $query
                ->where(
                    'status',
                    'approved'
                )
                ->where(
                    'is_on_hold',
                    false
                );

            return;
        }

        if ($tab === 'on_hold') {
            $query->where(
                'is_on_hold',
                true
            );

            return;
        }

        if ($tab === 'replied') {
            $query
                ->whereNotNull(
                    'admin_reply'
                )
                ->where(
                    'admin_reply',
                    '!=',
                    ''
                );

            return;
        }

        if (
            $tab ===
            'awaiting_reply'
        ) {
            $query
                ->where(
                    'status',
                    'approved'
                )
                ->where(
                    'is_on_hold',
                    false
                )
                ->where(
                    function ($query) {
                        $query
                            ->whereNull(
                                'admin_reply'
                            )
                            ->orWhere(
                                'admin_reply',
                                ''
                            );
                    }
                );
        }
    }

    private function getSummary(): array
    {
        $query =
            ProductReview::query()
                ->where(
                    'status',
                    'approved'
                )
                ->where(
                    'is_on_hold',
                    false
                );

        $totalReviews =
            (clone $query)->count();

        $averageRating =
            $totalReviews > 0
                ? round(
                    (float) (
                        clone $query
                    )->avg('rating'),
                    2
                )
                : 0;

        $ratingCounts = [];

        for (
            $rating = 5;
            $rating >= 1;
            $rating--
        ) {
            $ratingCounts[$rating] =
                (clone $query)
                    ->where(
                        'rating',
                        $rating
                    )
                    ->count();
        }

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

            'performance' =>
                $this->getPerformance(
                    $averageRating
                ),
        ];
    }

    private function getTabCounts(): array
    {
        return [
            'all' =>
                ProductReview::query()
                    ->count(),

            'published' =>
                ProductReview::query()
                    ->where(
                        'status',
                        'approved'
                    )
                    ->where(
                        'is_on_hold',
                        false
                    )
                    ->count(),

            'on_hold' =>
                ProductReview::query()
                    ->where(
                        'is_on_hold',
                        true
                    )
                    ->count(),

            'replied' =>
                ProductReview::query()
                    ->whereNotNull(
                        'admin_reply'
                    )
                    ->where(
                        'admin_reply',
                        '!=',
                        ''
                    )
                    ->count(),

            'awaiting_reply' =>
                ProductReview::query()
                    ->where(
                        'status',
                        'approved'
                    )
                    ->where(
                        'is_on_hold',
                        false
                    )
                    ->where(
                        function ($query) {
                            $query
                                ->whereNull(
                                    'admin_reply'
                                )
                                ->orWhere(
                                    'admin_reply',
                                    ''
                                );
                        }
                    )
                    ->count(),
        ];
    }

    private function transformReview(
        ProductReview $review
    ): array {
        $user =
            $review->user;

        $product =
            $review->product;

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

            'product' => [
                'id' =>
                    $product?->id,

                'title' =>
                    $product?->title,

                'slug' =>
                    $product?->slug,

                'image_url' =>
                    $this->getProductImage(
                        $product
                    ),
            ],

            'reviewer' => [
                'id' =>
                    $user?->id,

                'name' =>
                    $reviewerName,

                'email' =>
                    $user?->email,

                'avatar_url' =>
                    $this->getUserAvatar(
                        $user
                    ),
            ],

            'rating' =>
                (int)
                $review->rating,

            'title' =>
                $review->title,

            'review' =>
                $review->review,

            'status' =>
                $review->status,

            'display_status' =>
                $this->getDisplayStatus(
                    $review
                ),

            'is_on_hold' =>
                (bool)
                $review->is_on_hold,

            'hold_reason' =>
                $review->hold_reason,

            'held_at' =>
                $review->held_at,

            'admin_reply' =>
                $review->admin_reply,

            'replied_at' =>
                $review->replied_at,

            'replied_by' => [
                'id' =>
                    $review->repliedBy?->id,

                'name' =>
                    $review->repliedBy?->name,
            ],

            'is_verified_purchase' =>
                (bool)
                $review
                    ->is_verified_purchase,

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

            'approved_at' =>
                $review->approved_at,
        ];
    }

    private function getDisplayStatus(
        ProductReview $review
    ): string {
        if (
            $review->is_on_hold
        ) {
            return 'on_hold';
        }

        if (
            $review->status ===
            'rejected'
        ) {
            return 'rejected';
        }

        if (
            $review->status ===
            'pending'
        ) {
            return 'pending';
        }

        return 'published';
    }

    private function getPerformance(
        float $rating
    ): array {
        if ($rating >= 4.5) {
            return [
                'key' =>
                    'excellent',

                'label' =>
                    'Excellent',
            ];
        }

        if ($rating >= 4) {
            return [
                'key' =>
                    'good',

                'label' =>
                    'Good',
            ];
        }

        if ($rating >= 3) {
            return [
                'key' =>
                    'average',

                'label' =>
                    'Average',
            ];
        }

        if ($rating >= 2) {
            return [
                'key' =>
                    'needs_attention',

                'label' =>
                    'Needs attention',
            ];
        }

        if ($rating > 0) {
            return [
                'key' =>
                    'poor',

                'label' =>
                    'Poor',
            ];
        }

        return [
            'key' =>
                'no_reviews',

            'label' =>
                'No reviews',
        ];
    }

    private function reviewActionResponse(
        ProductReview $productReview,
        string $message
    ): JsonResponse {
        $productReview->load([
            'product.media',
            'user',
            'images',
            'repliedBy',
            'heldBy',
        ]);

        return response()->json([
            'success' =>
                true,

            'message' =>
                $message,

            'review' =>
                $this->transformReview(
                    $productReview
                ),

            'summary' =>
                $this->getSummary(),

            'tab_counts' =>
                $this->getTabCounts(),
        ]);
    }

    private function getProductImage(
        $product
    ): ?string {
        if (!$product) {
            return null;
        }

        if (
            !empty(
                $product->image_url
            )
        ) {
            return $product->image_url;
        }

        $media =
            $product->media
                ?->firstWhere(
                    'is_cover',
                    true
                )
            ?? $product->media
                ?->first();

        if (!$media) {
            return null;
        }

        $path =
            $media->url
            ?? $media->file_url
            ?? $media->path
            ?? $media->file_path
            ?? null;

        if (!$path) {
            return null;
        }

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

        return
            $baseUrl
            . '/storage/'
            . $cleanPath;
    }

    private function getUserAvatar(
        $user
    ): ?string {
        if (!$user) {
            return null;
        }

        $photo =
            $user->photo
            ?? $user->avatar
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
        | NEW PUBLIC UPLOAD
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
        | FULL STORAGE RELATIVE PATH
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
        | product-reviews/image.webp
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

    private function deleteReviewImage(
        ?string $path
    ): void {
        if (!$path) {
            return;
        }

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
            return;
        }

        $cleanPath =
            ltrim(
                $path,
                '/'
            );

        /*
        |--------------------------------------------------------------------------
        | NEW PUBLIC UPLOAD
        |--------------------------------------------------------------------------
        */

        if (
            str_starts_with(
                $cleanPath,
                'uploads/'
            )
        ) {
            $filePath =
                public_path(
                    $cleanPath
                );

            if (
                File::exists(
                    $filePath
                )
            ) {
                File::delete(
                    $filePath
                );
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | STORAGE PATH
        |--------------------------------------------------------------------------
        */

        if (
            str_starts_with(
                $cleanPath,
                'storage/'
            )
        ) {
            $storagePath =
                substr(
                    $cleanPath,
                    strlen(
                        'storage/'
                    )
                );

            if (
                Storage::disk(
                    'public'
                )->exists(
                    $storagePath
                )
            ) {
                Storage::disk(
                    'public'
                )->delete(
                    $storagePath
                );
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | LEGACY PRODUCT REVIEW PATH
        |--------------------------------------------------------------------------
        */

        if (
            str_starts_with(
                $cleanPath,
                'product-reviews/'
            )
        ) {
            if (
                Storage::disk(
                    'public'
                )->exists(
                    $cleanPath
                )
            ) {
                Storage::disk(
                    'public'
                )->delete(
                    $cleanPath
                );
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | FALLBACK PUBLIC PATH
        |--------------------------------------------------------------------------
        */

        $filePath =
            public_path(
                $cleanPath
            );

        if (
            File::exists(
                $filePath
            )
        ) {
            File::delete(
                $filePath
            );
        }
    }
}