<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'parent_id',
        'status',
        'is_featured',
        'display_order',
        'seo_title',
        'seo_description',
        'tags',
        'mega_menu_image',
    ];


    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'parent_id' => 'integer',

            'is_featured' => 'boolean',

            'display_order' => 'integer',

            'tags' => 'array',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | PARENT CATEGORY
    |--------------------------------------------------------------------------
    */

    public function parent(): BelongsTo
    {
        return $this->belongsTo(
            Category::class,
            'parent_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CHILD CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function children(): HasMany
    {
        return $this->hasMany(
            Category::class,
            'parent_id'
        )
        ->orderBy('display_order')
        ->orderBy('name');
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVE SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query
            ->where(
                'status',
                'active'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | INACTIVE SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeInactive($query)
    {
        return $query
            ->where(
                'status',
                'inactive'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | FEATURED SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeFeatured($query)
    {
        return $query
            ->where(
                'is_featured',
                true
            );
    }


    /*
    |--------------------------------------------------------------------------
    | ROOT / PARENT CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function scopeRoot($query)
    {
        return $query
            ->whereNull(
                'parent_id'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDERED
    |--------------------------------------------------------------------------
    */

    public function scopeOrdered($query)
    {
        return $query
            ->orderBy(
                'display_order'
            )
            ->orderBy(
                'name'
            );
    }


    public function products()
{
    return $this->hasMany(
        Product::class,
        'category_id'
    );
}


    /*
    |--------------------------------------------------------------------------
    | IMAGE URL
    |--------------------------------------------------------------------------
    |
    | Database:
    | uploads/categories/accessories.png
    |
    | API:
    | http://127.0.0.1:8000/uploads/categories/accessories.png
    |
    */

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        return asset(
            $this->image
        );
    }
}
