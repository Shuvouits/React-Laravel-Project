<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'birthdate',
        'gender',
        'photo',
        'password',
        'role',
        'account_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birthdate' => 'date',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function vendorApplication(): HasOne
    {
        return $this->hasOne(
            VendorApplication::class
        );
    }

    public function vendor(): HasOne
    {
        return $this->hasOne(
            Vendor::class
        );
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(
            CustomerAddress::class
        );
    }

    public function defaultAddress(): HasOne
    {
        return $this->hasOne(
            CustomerAddress::class
        )->where(
            'is_default',
            true
        );
    }

    public function customerProfile(): HasOne
    {
        return $this->hasOne(
            CustomerProfile::class
        );
    }

    public function orders(): HasMany
    {
        return $this->hasMany(
            Order::class
        );
    }

    public function preference(): HasOne
    {
        return $this->hasOne(
            UserPreference::class
        );
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(
            Wishlist::class
        );
    }


    public function customerConversations(): HasMany
{
    return $this->hasMany(
        Conversation::class,
        'customer_id'
    );
}

public function sentConversationMessages(): HasMany
{
    return $this->hasMany(
        ConversationMessage::class,
        'sender_user_id'
    );
}

public function assignedConversations(): HasMany
{
    return $this->hasMany(
        Conversation::class,
        'assigned_to'
    );
}



}
