<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GlobalVariant extends Model
{
    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'name',
        'visual_type',
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
            'sort_order' => 'integer',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | VALUES
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | Size
    | ├── Small
    | ├── Medium
    | ├── Large
    | └── Extra-Large
    |
    */

    public function values(): HasMany
    {
        return $this
            ->hasMany(
                GlobalVariantValue::class,
                'global_variant_id'
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
                'name'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | COLOR VARIANT HELPER
    |--------------------------------------------------------------------------
    |
    | "Color" / "Colour" হলে frontend-এ color swatches দেখাতে কাজে লাগবে।
    |
    */

    public function getIsColorAttribute(): bool
    {
        $name = strtolower(
            trim(
                $this->name
            )
        );


        return in_array(
            $name,
            [
                'color',
                'colour',
            ],
            true
        );
    }
}
