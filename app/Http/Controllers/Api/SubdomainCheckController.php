<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Rules\Subdomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubdomainCheckController extends Controller
{
    /**
     * Check if a subdomain is available and valid.
     */
    public function check(Request $request): JsonResponse
    {
        $subdomain = strtolower(trim((string) $request->query('subdomain', '')));
        $ignoreTenantId = $request->query('ignore_tenant_id') ? (int) $request->query('ignore_tenant_id') : null;

        if (empty($subdomain)) {
            return response()->json([
                'available' => false,
                'subdomain' => '',
                'message' => 'Please enter a subdomain.',
            ], 422);
        }

        $validator = Validator::make(
            ['subdomain' => $subdomain],
            ['subdomain' => ['required', new Subdomain($ignoreTenantId)]]
        );

        if ($validator->fails()) {
            return response()->json([
                'available' => false,
                'subdomain' => $subdomain,
                'message' => $validator->errors()->first('subdomain'),
            ]);
        }

        return response()->json([
            'available' => true,
            'subdomain' => $subdomain,
            'message' => "{$subdomain} is available",
            'portal_url' => \App\Services\TenantUrl::to(new Tenant(['subdomain' => $subdomain])),
        ]);
    }
}
