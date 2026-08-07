<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post('/register', [
        AuthController::class,
        'register'
    ]);

    Route::post('/vendor/register', [
        AuthController::class,
        'vendorRegister'
    ]);

    Route::post('/login', [
        AuthController::class,
        'login'
    ]);

});


/*
|--------------------------------------------------------------------------
| Protected Authentication Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')
    ->prefix('auth')
    ->group(function () {

        Route::get('/me', [
            AuthController::class,
            'me'
        ]);

        Route::post('/logout', [
            AuthController::class,
            'logout'
        ]);

        Route::post('/logout-all', [
            AuthController::class,
            'logoutAll'
        ]);

    });
