<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'rating',
        'title',
        'review',
        'status',
        'is_on_hold',
        'admin_reply',
        'replied_by',
        'replied_at',
        'held_by',
        'held_at',
        'hold_reason',
        'is_verified_purchase',
        'helpful_count',
        'approved_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_on_hold' => 'boolean',
        'is_verified_purchase' => 'boolean',
        'helpful_count' => 'integer',
        'replied_by' => 'integer',
        'held_by' => 'integer',
        'replied_at' => 'datetime',
        'held_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class
        );
    }

    public function images(): HasMany
    {
        return $this->hasMany(
            ProductReviewImage::class,
            'product_review_id'
        )->orderBy('sort_order');
    }

    public function repliedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'replied_by'
        );
    }

    public function heldBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'held_by'
        );
    }
}