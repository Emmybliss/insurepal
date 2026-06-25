<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Skip for super admin
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        // Skip if no tenant (shouldn't happen)
        if (! $user || ! $user->tenant) {
            return redirect()->route('login')
                ->with('error', 'No tenant found for your account. Please contact support.');
        }

        $tenant = $user->tenant;

        // Check if onboarding is completed
        if (! $tenant->onboarding_completed) {
            // Allow access to onboarding routes
            if ($request->routeIs('onboarding.*') ||
                $request->routeIs('subscription.*') ||
                $request->routeIs('logout')) {
                return $next($request);
            }

            // Determine next onboarding step
            $steps = $tenant->onboarding_steps ?? [];
            $hasPlan = ! empty($tenant->subscription_plan_id);

            if (! ($steps['subscription_selected'] ?? false) && ! $hasPlan) {
                return redirect()->route('onboarding.select-plan')
                    ->with('info', 'Please select a subscription plan to continue.');
            }

            if (! ($steps['payment_completed'] ?? false) && ! $hasPlan) {
                return redirect()->route('onboarding.select-plan')
                    ->with('info', 'Please complete payment to continue.');
            }

            if (! ($steps['company_details'] ?? false)) {
                return redirect()->route('onboarding.company-details')
                    ->with('info', 'Please complete your company profile to continue.');
            }

            // If all steps done but not marked complete, redirect to company details
            return redirect()->route('onboarding.company-details')
                ->with('info', 'Please complete your onboarding to access the dashboard.');
        }

        return $next($request);
    }
}
