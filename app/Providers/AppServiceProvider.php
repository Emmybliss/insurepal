<?php

namespace App\Providers;

use App\Models\Notification;
use App\Models\Policy;
use App\Models\Tenant;
use App\Observers\NotificationObserver;
use App\Observers\PolicyObserver;
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
        $this->app->singleton(\App\Services\AI\ToolRegistry::class);

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
        Policy::observe(PolicyObserver::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        Inertia::share([
            'locale' => fn () => App::getLocale(),
            'supportedLocales' => fn () => config('app.supported_locales', ['en']),
        ]);

        // Register AI tools
        $aiTools = [
            \App\Services\AI\Tools\SearchCustomerTool::class,
            \App\Services\AI\Tools\SearchPolicyTool::class,
            \App\Services\AI\Tools\GenerateQuoteTool::class,
            \App\Services\AI\Tools\IssuePolicyTool::class,
            \App\Services\AI\Tools\CancelPolicyTool::class,
            \App\Services\AI\Tools\RenewPolicyTool::class,
            \App\Services\AI\Tools\CreateDebitNoteTool::class,
            \App\Services\AI\Tools\CreateCreditNoteTool::class,
            \App\Services\AI\Tools\GenerateReceiptTool::class,
            \App\Services\AI\Tools\RegisterClaimTool::class,
            \App\Services\AI\Tools\ApproveClaimTool::class,
            \App\Services\AI\Tools\GenerateCertificateTool::class,
            \App\Services\AI\Tools\CalculatePremiumTool::class,
            \App\Services\AI\Tools\CalculateCommissionTool::class,
            \App\Services\AI\Tools\GenerateReportTool::class,
            \App\Services\AI\Tools\SendEmailTool::class,
            \App\Services\AI\Tools\ScheduleReminderTool::class,
            \App\Services\AI\Tools\SummarizeEmailsTool::class,
            \App\Services\AI\Tools\DraftQuoteResponseTool::class,
            \App\Services\AI\Tools\EmailToClaimTool::class,
        ];

        $registry = $this->app->make(\App\Services\AI\ToolRegistry::class);
        foreach ($aiTools as $toolClass) {
            $registry->register($this->app->make($toolClass));
        }
    }
}
