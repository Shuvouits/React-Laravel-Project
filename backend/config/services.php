<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
    'client_id' =>
        env('GOOGLE_CLIENT_ID'),

    'client_secret' =>
        env('GOOGLE_CLIENT_SECRET'),

    'redirect' =>
        env('GOOGLE_REDIRECT_URI'),
],


    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),

        'model' => env(
            'OPENROUTER_MODEL',
            'openrouter/free'
        ),

        'fallback_model' => env(
            'OPENROUTER_FALLBACK_MODEL'
        ),

        'url' => env(
            'OPENROUTER_URL',
            'https://openrouter.ai/api/v1/chat/completions'
        ),

        'base_url' => env(
            'OPENROUTER_BASE_URL',
            'https://openrouter.ai/api/v1'
        ),

        'site_url' => env(
            'FRONTEND_URL',
            'http://localhost:5173'
        ),

        'site_name' => env(
            'APP_NAME',
            'Storify'
        ),

    ],

];
