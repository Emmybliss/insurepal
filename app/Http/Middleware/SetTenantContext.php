<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->tenant_id) {
            $tenant = $user->tenant;

            app()->instance('tenant', $tenant);
            $request->attributes->set('tenant', $tenant);
        } elseif ($request->attributes->has('tenant')) {
            $tenant = $request->attributes->get('tenant');
            app()->instance('tenant', $tenant);
        } elseif (app()->bound('tenant')) {
            $request->attributes->set('tenant', app('tenant'));
        }

        return $next($request);
    }
}
