<?php

return [
    'gateway' => [
        'default' => env('AI_PROVIDER', 'openai'),
        'providers' => [
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
