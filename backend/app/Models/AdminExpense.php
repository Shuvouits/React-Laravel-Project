<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'expense_date',
        'amount',
        'currency',
        'description',
        'category',
        'paid_from',
        'paid_to',
        'book',
        'receipt_path',
        'repeats',
        'repeat_frequency',
        'next_repeat_date',
        'note',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'repeats' => 'boolean',
        'next_repeat_date' => 'date',
    ];

    protected $appends = [
        'receipt_url',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForBook(
        Builder $query,
        ?string $book
    ): Builder {
        if (!$book || $book === 'both') {
            return $query;
        }

        return $query->where('book', $book);
    }

    public function getReceiptUrlAttribute(): ?string
    {
        if (!$this->receipt_path) {
            return null;
        }

        return asset('storage/' . $this->receipt_path);
    }
}
