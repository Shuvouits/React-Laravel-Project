<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'title',
        'slug',
        'description',
        'image',

        'status',

        'online_store',
        'point_of_sale',

        'collection_type',

        'sort_order',
        'display_position',

        'seo_title',
        'seo_description',
    ];


    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'online_store' =>
                'boolean',

            'point_of_sale' =>
                'boolean',

            'display_position' =>
                'integer',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    |
    | Manual Collection:
    |
    | Kid's Joy
    | ├── iPhone 16 Pro
    | ├── iPhone 17 Pro Max
    | └── Haier TV
    |
    */

    public function products(): BelongsToMany
    {
        return $this
            ->belongsToMany(
                Product::class,
                'collection_product'
            )
            ->withPivot(
                'sort_order'
            )
            ->withTimestamps()
            ->orderBy(
                'collection_product.sort_order'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVE SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeActive(
        $query
    ) {
        return $query->where(
            'status',
            'active'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | INACTIVE SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeInactive(
        $query
    ) {
        return $query->where(
            'status',
            'inactive'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MANUAL COLLECTIONS
    |--------------------------------------------------------------------------
    */

    public function scopeManual(
        $query
    ) {
        return $query->where(
            'collection_type',
            'manual'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | AUTOMATED COLLECTIONS
    |--------------------------------------------------------------------------
    */

    public function scopeAutomated(
        $query
    ) {
        return $query->where(
            'collection_type',
            'automated'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | STOREFRONT
    |--------------------------------------------------------------------------
    */

    public function scopeOnlineStore(
        $query
    ) {
        return $query
            ->where(
                'online_store',
                true
            )
            ->where(
                'status',
                'active'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDERED
    |--------------------------------------------------------------------------
    */

    public function scopeOrdered(
        $query
    ) {
        return $query
            ->orderBy(
                'display_position'
            )
            ->orderBy(
                'title'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | IMAGE URL
    |--------------------------------------------------------------------------
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
