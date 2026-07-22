<?php

namespace App\Providers;

use App\Models\Notification;
use App\Models\Tenant;
use App\Observers\NotificationObserver;
use App\Observers\TenantObserver;
use App\Services\PlatformSettingsService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(
            \App\Services\Pdf\PdfService::class,
            \App\Services\Pdf\BrowsershotPdfService::class
        );
    }

    public function boot(): void
    {
        // Inject database platform settings into config (overrides .env values where DB settings exist)
        if (! $this->app->runningUnitTests()) {
            $this->app->make(PlatformSettingsService::class)->injectIntoConfig();
        }

        Notification::observe(NotificationObserver::class);
        Tenant::observe(TenantObserver::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        Inertia::share([
            'locale' => fn () => App::getLocale(),
            'supportedLocales' => fn () => config('app.supported_locales', ['en']),
        ]);

        // Register AI tools
        $this->app->make(\App\Services\AI\ToolRegistry::class)->register(
            $this->app->make(\App\Services\AI\Tools\SearchCustomerTool::class),
        );
        $this->app->make(\App\Services\AI\ToolRegistry::class)->register(
            $this->app->make(\App\Services\AI\Tools\SearchPolicyTool::class),
        );
        $this->app->make(\App\Services\AI\ToolRegistry::class)->register(
            $this->app->make(\App\Services\AI\Tools\GenerateQuoteTool::class),
        );
    }
}
