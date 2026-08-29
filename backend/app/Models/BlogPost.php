<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BlogPost extends Model
{
    protected $fillable = [
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'featured_image_alt',
        'status',
        'visibility',
        'is_featured',
        'allow_comments',
        'tags',
        'seo_title',
        'meta_description',
        'views_count',
        'comments_count',
        'published_at',
        'scheduled_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'allow_comments' => 'boolean',
            'tags' => 'array',
            'views_count' => 'integer',
            'comments_count' => 'integer',
            'published_at' => 'datetime',
            'scheduled_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'author_id'
        );
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            BlogCategory::class,
            'blog_post_category',
            'blog_post_id',
            'blog_category_id'
        )->withTimestamps();
    }

    public function scopePublished(
        Builder $query
    ): Builder {
        return $query
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->where(function (Builder $dateQuery) {
                $dateQuery
                    ->whereNull('published_at')
                    ->orWhere(
                        'published_at',
                        '<=',
                        now()
                    );
            });
    }

    public function scopeFeatured(
        Builder $query
    ): Builder {
        return $query->where(
            'is_featured',
            true
        );
    }

    public function scopeLatestPublished(
        Builder $query
    ): Builder {
        return $query->orderByDesc(
            'published_at'
        );
    }

    public function getFeaturedImageUrlAttribute(): ?string
    {
        if (!$this->featured_image) {
            return null;
        }

        if (
            str_starts_with(
                $this->featured_image,
                'http://'
            ) ||
            str_starts_with(
                $this->featured_image,
                'https://'
            )
        ) {
            return $this->featured_image;
        }

        return asset($this->featured_image);
    }
}