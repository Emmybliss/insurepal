<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthorized');
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user->tenant_id || ! $user->tenant) {
            abort(403, 'No tenant access');
        }

        if (! $user->tenant->isActive()) {
            abort(403, 'Tenant suspended');
        }

        if (! $user->is_active) {
            abort(403, 'User account suspended');
        }

        // Prevent data modification if subscription has expired
        if ($user->tenant->subscription_expires_at && $user->tenant->subscription_expires_at->isPast()) {
            $isReadRequest = $request->isMethod('GET') || $request->isMethod('HEAD') || $request->isMethod('OPTIONS');
            if (! $isReadRequest) {
                if ($request->wantsJson()) {
                    abort(403, 'Your subscription has expired. Please renew to perform this action.');
                }

                return back()->with('error', 'Your subscription has expired. Please renew to perform this action.');
            }
        }

        return $next($request);
    }
}
