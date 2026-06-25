<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $plan  Required plan (starter, professional, enterprise)
     */
    public function handle(Request $request, Closure $next, string $plan): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        // Super admins bypass plan restrictions
        if ($user->hasRole('super_admin')) {
            return $next($request);
        }

        $tenant = $user->tenant;

        if (! $tenant) {
            abort(403, 'No tenant associated.');
        }

        $subscriptionPlan = $tenant->subscriptionPlan;

        if (! $subscriptionPlan) {
            abort(403, 'No active subscription plan found.');
        }

        // Define plan priorities based on seeder sort_order
        // 1: starter, 2: professional, 3: enterprise
        $requiredOrder = match ($plan) {
            'starter' => 1,
            'professional' => 2,
            'enterprise' => 3,
            default => 999, // Unknown plan blocks by default
        };

        if ($subscriptionPlan->sort_order < $requiredOrder) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Your subscription plan does not allow access to this feature. Please upgrade.'], 403);
            }
            abort(403, 'Your subscription plan ('.$subscriptionPlan->name.') does not allow access to this feature. Please upgrade.');
        }

        return $next($request);
    }
}
