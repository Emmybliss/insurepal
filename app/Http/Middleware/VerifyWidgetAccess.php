<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWidgetAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $publicKey = $request->header('X-Tenant-Key');

        \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: '.$publicKey);

        if (! $publicKey) {
            \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Missing Key');

            return response()->json([
                'message' => 'Missing Tenant Key',
            ], 401);
        }

        // Search in TenantApiKey by public_key
        $apiKeyRecord = \App\Models\TenantApiKey::where('public_key', $publicKey)
            ->where('is_active', true)
            ->first();

        if (! $apiKeyRecord) {
            \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Record Not Found');

            return response()->json([
                'message' => 'Invalid or inactive Tenant Key',
            ], 401);
        }

        $tenant = $apiKeyRecord->tenant;

        \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Tenant '.($tenant ? $tenant->id : 'null'));

        if (! $tenant || ! $tenant->isActiveSubscriber()) {
            \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Inactive Tenant');

            return response()->json([
                'message' => 'Tenant inactive',
            ], 401);
        }

        // DOMAIN WHITELISTING
        $origin = $request->header('Origin') ?? $request->header('Referer');
        \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Origin '.$origin);

        if (! $apiKeyRecord->isDomainAllowed($origin)) {
            \Illuminate\Support\Facades\Log::info('VerifyWidgetAccess: Domain Denied');

            return response()->json([
                'message' => 'Domain not authorized for this widget key',
            ], 403);
        }

        // Update stats
        $apiKeyRecord->update(['last_used_at' => now()]);

        $request->merge(['tenant' => $tenant]);

        return $next($request);
    }
}
