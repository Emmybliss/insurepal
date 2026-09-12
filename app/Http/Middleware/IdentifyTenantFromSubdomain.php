<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantUrl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenantFromSubdomain
{
    /**
     * Handle an incoming request by identifying tenant from hostname subdomain.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->header('Host') ?? $request->getHost();
        $subdomain = TenantUrl::extractSubdomain($host);

        if ($subdomain !== null) {
            $tenant = Tenant::where('subdomain', $subdomain)->first();

            if (! $tenant) {
                abort(404, "Tenant portal '{$subdomain}' was not found.");
            }

            if (! $tenant->isActive() && ! $request->is('admin*')) {
                abort(403, "The portal '{$tenant->name}' is currently suspended. Please contact support.");
            }

            app()->instance('tenant', $tenant);
            $request->attributes->set('tenant', $tenant);
            $request->attributes->set('subdomain', $subdomain);
        }

        return $next($request);
    }
}
