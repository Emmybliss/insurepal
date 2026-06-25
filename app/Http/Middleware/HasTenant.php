<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthorized');
        }

        // Must have a tenant_id (excludes super_admin)
        if (! $user->tenant_id) {
            abort(403, 'Access denied: No tenant association.');
        }

        // Verify tenant is active
        $tenant = $user->tenant;
        if (! $tenant || ! $tenant->isActive()) {
            abort(403, 'Access denied: Inactive tenant.');
        }

        return $next($request);
    }
}
