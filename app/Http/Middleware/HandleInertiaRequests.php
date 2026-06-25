<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => $this->getMinimalAuthData($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'errors' => fn () => $request->session()->get('errors')
                ? $request->session()->get('errors')->getBag('default')->getMessages()
                : (object) [],
            'theme' => $this->getMinimalTheme($request),
            'vapidPublicKey' => config('services.vapid.public_key'),
            'appUrl' => $request->getSchemeAndHttpHost(),
            'turnstile' => [
                'siteKey' => config('services.turnstile.site_key'),
            ],
        ];
    }

    private function getMinimalAuthData(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return ['user' => null, 'tenant_plan' => null, 'tenant_subscription' => null];
        }

        $tenant = $user->tenant;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'signature' => $user->signature,
                'signature_url' => $user->signature_url,
                'locale' => $user->locale,
                'tenant_id' => $user->tenant_id,
                'roles' => $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ])->toArray(),
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'primary_role' => $user->getPrimaryRoleName(),
            ],
            'tenant_id' => $user->tenant_id,
            'tenant_plan' => $tenant?->subscriptionPlan ? [
                'slug' => $tenant->subscriptionPlan->slug,
                'name' => $tenant->subscriptionPlan->name,
                'sort_order' => $tenant->subscriptionPlan->sort_order,
                'features' => $this->getMinimalFeatures($tenant->subscriptionPlan->features),
            ] : null,
            'tenant_subscription' => $tenant ? [
                'is_expired' => $tenant->subscription_expires_at && $tenant->subscription_expires_at->isPast(),
                'expires_at' => $tenant->subscription_expires_at?->toIso8601String(),
                'started_at' => $tenant->subscription_started_at?->toIso8601String(),
                'has_auto_renewal' => ! empty($tenant->paystack_subscription_code),
                'billing_cycle' => $tenant->subscriptionPlan?->billing_cycle ?? 'monthly',
            ] : null,
        ];
    }

    private function getMinimalFeatures(?array $features): array
    {
        if (empty($features)) {
            return [];
        }

        return array_keys(array_filter($features, fn ($value) => $value === true || $value > 0));
    }

    private function getMinimalTheme(Request $request): array
    {
        $user = $request->user();

        if (! $user || ! $user->tenant) {
            return Tenant::getDefaultTheme();
        }

        $theme = $user->tenant->getTheme();

        return [
            'primary_color' => $theme['primary_color'] ?? '#3b82f6',
            'secondary_color' => $theme['secondary_color'] ?? '#8b5cf6',
            'accent_color' => $theme['accent_color'] ?? '#10b981',
        ];
    }
}
