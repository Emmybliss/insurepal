<?php

use App\Http\Middleware\EnsureOnboardingCompleted;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\SetTenantContext;
use App\Http\Middleware\SuperAdminOnly;
use App\Http\Middleware\TenantScope;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web([
            // ✅ Core Laravel session & state middlewares
            // \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class, // REQUIRED for flash + old inputs
            \Illuminate\View\Middleware\ShareErrorsFromSession::class, // REQUIRED for validation errors
            // \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,

            // ✅ Your custom middlewares
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\UpdateLastActiveAt::class,
        ]);

        $middleware->api(prepend: []);

        $middleware->alias([
            'tenant.access' => EnsureTenantAccess::class,
            'tenant.context' => SetTenantContext::class,
            'tenant.scope' => TenantScope::class,
            'has.tenant' => \App\Http\Middleware\HasTenant::class,
            'super.admin' => SuperAdminOnly::class,
            'permission' => PermissionMiddleware::class,
            'onboarding.completed' => EnsureOnboardingCompleted::class,
            'plan' => \App\Http\Middleware\CheckPlanAccess::class,
            'tenant.type' => \App\Http\Middleware\TenantType::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function ($response, $exception, $request) {
            $status = $response->getStatusCode();
            $shouldRenderInertia = in_array($status, [500, 503, 404, 403, 419]);

            if ($shouldRenderInertia) {
                // Render themed error page if not in local/testing OR if preview is requested
                if (! app()->environment(['local', 'testing']) || $request->query('preview') == '1' || $status === 419) {
                    return Inertia\Inertia::render('error', ['status' => $status])
                        ->toResponse($request)
                        ->setStatusCode($status);
                }
            }

            return $response;
        });
    })->create();
