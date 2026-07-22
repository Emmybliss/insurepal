<?php

// Auto-detect Windows paths for Spatie Browsershot
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
$defaultNode = $isWindows && file_exists('C:\\Program Files\\nodejs\\node.exe') ? 'C:\\Program Files\\nodejs\\node.exe' : null;
$defaultNpm = $isWindows && file_exists('C:\\Program Files\\nodejs\\npm.cmd') ? 'C:\\Program Files\\nodejs\\npm.cmd' : null;
$defaultChrome = null;
if ($isWindows) {
    $chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    foreach ($chromePaths as $path) {
        if (file_exists($path)) {
            $defaultChrome = $path;
            break;
        }
    }
}
$defaultNodeModules = base_path('node_modules');

return [

    /*
    |--------------------------------------------------------------------------
    | Default PDF Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default PDF generation driver used by the
    | application. By default, it uses 'browsershot'.
    |
    */

    'driver' => env('PDF_DRIVER', 'browsershot'),

    /*
    |--------------------------------------------------------------------------
    | Browsershot Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration settings specifically for Spatie Browsershot (headless
    | Chrome/Puppeteer PDF renderer).
    |
    */

    'browsershot' => [
        'node_binary' => env('BROWSERSHOT_NODE_BINARY', $defaultNode),
        'npm_binary' => env('BROWSERSHOT_NPM_BINARY', $defaultNpm),
        'chrome_binary' => env('BROWSERSHOT_CHROME_BINARY', $defaultChrome),
        'node_modules' => env('BROWSERSHOT_NODE_MODULES', $defaultNodeModules),
        'no_sandbox' => env('BROWSERSHOT_NO_SANDBOX', true),
        'timeout' => (int) env('BROWSERSHOT_TIMEOUT', 120),
    ],

];
