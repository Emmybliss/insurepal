<?php

return [
    'gateway' => [
        'default' => env('AI_PROVIDER', 'gemini'),
        'providers' => [
            'gemini' => [
                'api_key' => env('GEMINI_API_KEY', env('AI_API_KEY')),
                'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
                'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
            ],
            'openai' => [
                'api_key' => env('OPENAI_API_KEY'),
                'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                'model' => env('OPENAI_MODEL', 'gpt-4o'),
            ],
            'anthropic' => [
                'api_key' => env('ANTHROPIC_API_KEY'),
                'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com/v1'),
                'model' => env('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
            ],
        ],
    ],
];
