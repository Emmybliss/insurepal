<?php

namespace App\Providers;

use App\Models\Notification;
use App\Observers\NotificationObserver;
use Illuminate\Support\Facades\App;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Notification::observe(NotificationObserver::class);

        Inertia::share([
            'locale' => fn () => App::getLocale(),
            'supportedLocales' => fn () => config('app.supported_locales', ['en']),
        ]);
    }
}
