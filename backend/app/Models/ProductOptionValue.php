<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductOptionValue extends Model
{
    protected $fillable = [
        'product_option_id',
        'global_variant_value_id',
        'value',
        'color_code',
        'sort_order',
    ];


    protected function casts(): array
    {
        return [
            'product_option_id' =>
                'integer',

            'global_variant_value_id' =>
                'integer',

            'sort_order' =>
                'integer',
        ];
    }


    public function option(): BelongsTo
    {
        return $this->belongsTo(
            ProductOption::class,
            'product_option_id'
        );
    }


    public function globalValue(): BelongsTo
    {
        return $this->belongsTo(
            GlobalVariantValue::class,
            'global_variant_value_id'
        );
    }


    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'product_variant_option_value'
        )
        ->withTimestamps();
    }
}
