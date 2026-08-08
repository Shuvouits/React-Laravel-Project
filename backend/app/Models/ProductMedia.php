<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMedia extends Model
{
    protected $table =
        'product_media';


    protected $fillable = [
        'product_id',
        'file_path',
        'media_type',
        'alt_text',
        'is_cover',
        'sort_order',
    ];


    protected function casts(): array
    {
        return [
            'product_id' =>
                'integer',

            'is_cover' =>
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


    public function getUrlAttribute(): string
    {
        return asset(
            $this->file_path
        );
    }
}
