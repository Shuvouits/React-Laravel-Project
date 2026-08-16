<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'title',
        'combination_key',
        'product_media_id',

        'price',
        'compare_at_price',
        'cost_per_item',

        'sku',
        'barcode',
        'quantity',

        'is_active',
        'sort_order',
    ];


    protected function casts(): array
    {
        return [
            'product_id' =>
                'integer',

            'product_media_id' =>
                'integer',

            'price' =>
                'decimal:2',

            'compare_at_price' =>
                'decimal:2',

            'cost_per_item' =>
                'decimal:2',

            'quantity' =>
                'integer',

            'is_active' =>
                'boolean',

            'sort_order' =>
                'integer',
        ];
    }


    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class
        );
    }


    public function media(): BelongsTo
    {
        return $this->belongsTo(
            ProductMedia::class,
            'product_media_id'
        );
    }


    public function optionValues(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductOptionValue::class,
            'product_variant_option_value'
        )
        ->withTimestamps();
    }


    public function inventoryLevels()
{
    return $this->hasMany(
        InventoryLevel::class,
        'variant_id'
    );
}

public function inventoryMovements()
{
    return $this->hasMany(
        InventoryMovement::class,
        'variant_id'
    );
}




}
