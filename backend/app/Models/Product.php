<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'summary',
        'description',
        'specifications',

        'status',
        'is_featured',

        'online_store',
        'point_of_sale',

        'category_id',
        'brand_id',
        'type',
        'tags',

        'source',
        'created_by',

        'product_format',
        'preorder_enabled',

        'price',
        'compare_at_price',
        'cost_per_item',

        'sku',
        'barcode',
        'quantity',

        'track_quantity',
        'continue_selling_when_out_of_stock',

        'weight',
        'weight_unit',
        'country_of_origin',
        'hs_code',
        'customs_description',

        'seo_title',
        'seo_description',
    ];


    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',

            'online_store' => 'boolean',
            'point_of_sale' => 'boolean',

            'preorder_enabled' => 'boolean',

            'track_quantity' => 'boolean',

            'continue_selling_when_out_of_stock' =>
                'boolean',

            'tags' => 'array',

            'price' => 'decimal:2',

            'compare_at_price' =>
                'decimal:2',

            'cost_per_item' =>
                'decimal:2',

            'weight' =>
                'decimal:3',

            'quantity' =>
                'integer',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            Category::class
        );
    }


    /*
    |--------------------------------------------------------------------------
    | BRAND
    |--------------------------------------------------------------------------
    */

    public function brand(): BelongsTo
    {
        return $this->belongsTo(
            Brand::class
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CREATOR
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MEDIA
    |--------------------------------------------------------------------------
    */

    public function media(): HasMany
    {
        return $this
            ->hasMany(
                ProductMedia::class
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'id'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | COVER
    |--------------------------------------------------------------------------
    */

    public function cover(): HasMany
    {
        return $this
            ->hasMany(
                ProductMedia::class
            )
            ->where(
                'is_cover',
                true
            );
    }


    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    public function options(): HasMany
    {
        return $this
            ->hasMany(
                ProductOption::class
            )
            ->orderBy(
                'sort_order'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | VARIANTS
    |--------------------------------------------------------------------------
    */

    public function variants(): HasMany
    {
        return $this
            ->hasMany(
                ProductVariant::class
            )
            ->orderBy(
                'sort_order'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where(
            'status',
            'active'
        );
    }


    public function scopeDraft($query)
    {
        return $query->where(
            'status',
            'draft'
        );
    }


    public function scopeArchived($query)
    {
        return $query->where(
            'status',
            'archived'
        );
    }


    public function scopeFeatured($query)
    {
        return $query->where(
            'is_featured',
            true
        );
    }


    /*
|--------------------------------------------------------------------------
| COLLECTIONS
|--------------------------------------------------------------------------
*/

public function collections()
{
    return $this
        ->belongsToMany(
            Collection::class,
            'collection_product'
        )
        ->withPivot(
            'sort_order'
        )
        ->withTimestamps();
}





}
