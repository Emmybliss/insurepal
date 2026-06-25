<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TenantScope
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user) {
            return $next($request);
        }

        // Super admins are not scoped to any tenant
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Ensure user belongs to a tenant
        if (! $user->tenant_id) {
            abort(403, 'Access denied: No tenant association.');
        }

        // Verify tenant is active
        $tenant = $user->tenant;
        if (! $tenant || ! $tenant->isActive()) {
            abort(403, 'Access denied: Inactive tenant.');
        }

        // Set tenant context for the request
        $request->attributes->set('tenant', $tenant);
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
