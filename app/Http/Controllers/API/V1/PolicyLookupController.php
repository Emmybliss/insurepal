<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DraftPolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PolicyLookupController extends Controller
{
    public function __construct(
        protected DraftPolicyService $draftPolicyService
    ) {}

    public function search(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->get('query');
        $customerId = $request->filled('customer_id') ? (int) $request->get('customer_id') : null;
        $limit = (int) $request->get('limit', 20);

        if (! $customerId && ! $request->filled('allow_global')) {
            return response()->json([]);
        }

        $policies = $this->draftPolicyService->search($user->tenant_id, $query, $customerId, $limit);

        return response()->json($policies->map(fn ($policy) => [
            'id' => $policy->id,
            'policy_number' => $policy->policy_number,
            'internal_reference' => $policy->internal_reference,
            'policy_number_display' => $policy->policy_number_display,
            'status' => $policy->status,
            'customer_id' => $policy->customer_id,
            'premium_amount' => $policy->premium_amount,
            'total_amount' => $policy->total_amount,
            'sum_insured' => $policy->sum_insured,
            'effective_date' => $policy->effective_date ? $policy->effective_date->format('Y-m-d') : null,
            'expiry_date' => $policy->expiry_date ? $policy->expiry_date->format('Y-m-d') : null,
            'policy_product' => $policy->policyProduct ? [
                'id' => $policy->policyProduct->id,
                'name' => $policy->policyProduct->name,
            ] : null,
            'policy_class' => $policy->policyClass ? [
                'id' => $policy->policyClass->id,
                'name' => $policy->policyClass->name,
            ] : null,
            'policy_type' => $policy->policyType ? [
                'id' => $policy->policyType->id,
                'name' => $policy->policyType->name,
            ] : null,
        ]));
    }
}
