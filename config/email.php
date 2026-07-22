<?php

return [
    'oauth' => [
        'gmail' => [
            'client_id' => env('GMAIL_CLIENT_ID'),
            'client_secret' => env('GMAIL_CLIENT_SECRET'),
            'redirect_uri' => env('GMAIL_REDIRECT_URI', '/api/v1/email/oauth/gmail/callback'),
        ],
        'microsoft365' => [
            'client_id' => env('MICROSOFT_CLIENT_ID'),
            'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
            'redirect_uri' => env('MICROSOFT_REDIRECT_URI', '/api/v1/email/oauth/microsoft/callback'),
        ],
    ],
];
