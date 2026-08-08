<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlobalVariantValue extends Model
{
    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'global_variant_id',
        'value',
        'color_code',
        'sort_order',
    ];


    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'global_variant_id' =>
                'integer',

            'sort_order' =>
                'integer',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | GLOBAL VARIANT
    |--------------------------------------------------------------------------
    */

    public function globalVariant(): BelongsTo
    {
        return $this->belongsTo(
            GlobalVariant::class,
            'global_variant_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDERED SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeOrdered(
        $query
    ) {
        return $query
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'id'
            );
    }
}
