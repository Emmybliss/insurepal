<?php

namespace App\Http\Middleware;

use App\Models\TenantApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyTenantApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $scope = null): Response
    {
        $inputKey = $request->header('X-API-KEY');

        if (! $inputKey) {
            return response()->json([
                'message' => 'Missing API Key',
            ], 401);
        }

        // Hash the input to lookup
        $hashedInput = hash('sha256', $inputKey);

        // Find the active key
        $apiKeyRecord = TenantApiKey::where('token_hash', $hashedInput)
            ->where('is_active', true)
            ->first();

        if (! $apiKeyRecord) {
            // BACKWARD COMPATIBILITY: Check old `tenants.api_key` column while migration is in progress?
            // User said "Migration: Create tenant_api_keys... Your current approach will cause future pain".
            // So we assume we are moving fully. However, legacy keys might break.
            // For now, let's stick to the new system as requested to be "hardened".
            return response()->json([
                'message' => 'Invalid or inactive API Key',
            ], 401);
        }

        $tenant = $apiKeyRecord->tenant;

        if (! $tenant || ! $tenant->isActiveSubscriber()) {
            return response()->json([
                'message' => 'Tenant inactive',
            ], 401);
        }

        // Decrypt to double check? (Optional, hash collision is negligible for SHA-256)
        // Basic check done.

        // Scope Check
        if ($scope && ! $apiKeyRecord->hasScope($scope)) {
            return response()->json([
                'message' => 'Insufficient permissions for this scope: '.$scope,
            ], 403);
        }

        // Update last used
        $apiKeyRecord->update(['last_used_at' => now()]);

        // Attach tenant
        $request->merge(['tenant' => $tenant]);

        return $next($request);
    }
}
