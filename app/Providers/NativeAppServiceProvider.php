<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class NativeAppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap desktop application window and tray icon.
     */
    public function boot(): void
    {
        if (! class_exists('\Native\Laravel\Facades\Window')) {
            return;
        }

        // NativePHP window & tray initialization when running in desktop process
        try {
            \Native\Laravel\Facades\Window::open('main')
                ->title('InsurePal Enterprise Desktop')
                ->width(1280)
                ->height(800)
                ->minWidth(1024)
                ->minHeight(700)
                ->rememberState();
        } catch (\Throwable $e) {
            // Ignored when running standard web server mode
        }
    }
}
