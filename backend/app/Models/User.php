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
        'email',
        'phone',
        'password',
        'role',
        'account_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Vendor application
    public function vendorApplication(): HasOne
    {
        return $this->hasOne(VendorApplication::class);
    }

    // Vendor store
    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class);
    }

    // Customer addresses
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    // Default customer address
    public function defaultAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class)
            ->where('is_default', true);
    }

    public function preference()
{
    return $this->hasOne(UserPreference::class);
}

public function wishlists(): HasMany
{
    return $this->hasMany(Wishlist::class);
}


}
