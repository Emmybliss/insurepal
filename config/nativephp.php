<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application Details
    |--------------------------------------------------------------------------
    */
    'version' => env('NATIVEPHP_APP_VERSION', '1.0.0'),
    'app_id' => 'com.insurepal.desktop',
    'deeplink_scheme' => 'insurepal',
    'author' => 'InsurePal AI SAAS',

    /*
    |--------------------------------------------------------------------------
    | Window Configuration
    |--------------------------------------------------------------------------
    */
    'window' => [
        'width' => 1280,
        'height' => 800,
        'min_width' => 1024,
        'min_height' => 700,
        'title' => 'InsurePal Enterprise Desktop',
        'resizable' => true,
        'show' => true,
        'auto_hide_menu_bar' => false,
        'single_instance' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Environment & Storage Configuration
    |--------------------------------------------------------------------------
    */
    'storage' => [
        'encrypted' => true,
        'tenant_isolation' => true,
        'credentials_vault' => 'os_keyring',
    ],
];
