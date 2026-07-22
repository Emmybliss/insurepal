<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StorePolicyRequest;
use App\Http\Requests\Api\V1\UpdatePolicyRequest;
use App\Http\Requests\Shared\ConvertQuoteRequest;
use App\Http\Resources\Api\V1\PolicyCollection;
use App\Http\Resources\Api\V1\PolicyResource;
use App\Http\Responses\ApiResponse;
use App\Models\Policy;
use App\Models\Quote;
use App\Services\Policies\CancelPolicyService;
use App\Services\PolicyIssuanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PolicyIssuanceService $policyIssuanceService,
        private CancelPolicyService $cancelPolicyService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Policy::forTenant($tenantId)
            ->with(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('policy_number', 'like', "%{$search}%")
                    ->orWhere('insurer_name', 'like', "%{$search}%");
            });
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($approvalStatus = $request->approval_status) {
            $query->where('approval_status', $approvalStatus);
        }

        if ($sourceType = $request->source_type) {
            $query->where('source_type', $sourceType);
        }

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($productId = $request->policy_product_id) {
            $query->where('policy_product_id', $productId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($request->boolean('active')) {
            $query->active();
        }

        if ($request->boolean('expiring')) {
            $days = (int) $request->input('expiring_days', 30);
            $query->expiring($days);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'policy_number', 'effective_date', 'expiry_date',
                'premium_amount', 'total_amount', 'status', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $policies = $query->paginate($perPage);

        return PolicyCollection::make($policies)->response();
    }

    public function store(StorePolicyRequest $request): JsonResponse
    {
        try {
            $policy = $this->policyIssuanceService->createDirectPolicy(
                $request->validated(),
                $request->user()
            );

            $policy->load(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy']);

            return $this->respondCreated(
                new PolicyResource($policy),
                'Policy created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function show(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $policy->load([
            'customer',
            'policyProduct',
            'policyType',
            'policyClass',
            'createdBy',
            'approvedBy',
            'issuedBy',
            'quote',
            'insurer',
            'debitNotes',
            'creditNotes',
        ]);

        return $this->respond(new PolicyResource($policy));
    }

    public function update(UpdatePolicyRequest $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $policy->isDraft() && ! $policy->isPendingApproval()) {
            return $this->respondError('Only draft or pending approval policies can be updated.', 422);
        }

        $policy->update($request->validated());

        $policy->load(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy']);

        return $this->respond(
            new PolicyResource($policy),
            'Policy updated successfully.'
        );
    }

    public function destroy(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $policy->isDraft()) {
            return $this->respondError('Only draft policies can be deleted.', 422);
        }

        $policy->delete();

        return $this->respondNoContent('Policy deleted successfully.');
    }

    public function submitForApproval(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['notes' => 'nullable|string|max:2000']); // single field — leave inline

        try {
            $approval = $this->policyIssuanceService->submitPolicyForApproval(
                $policy,
                $request->user(),
                $request->notes
            );

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy'])),
                'Policy submitted for approval successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function approve(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['notes' => 'nullable|string|max:2000']); // single field — leave inline

        try {
            $this->policyIssuanceService->approvePolicy(
                $policy,
                $request->user(),
                $request->notes
            );

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy', 'approvedBy'])),
                'Policy approved successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function reject(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['reason' => 'required|string|max:2000']); // single field — leave inline

        try {
            $this->policyIssuanceService->rejectPolicy(
                $policy,
                $request->user(),
                $request->reason
            );

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy'])),
                'Policy rejected successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function issue(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->policyIssuanceService->issuePolicy($policy);

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy', 'issuedBy'])),
                'Policy issued successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function cancel(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['reason' => 'nullable|string|max:2000']); // single field — leave inline

        try {
            $this->cancelPolicyService->cancel($policy, $request->reason);

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy'])),
                'Policy cancelled successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function suspend(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['reason' => 'nullable|string|max:2000']); // single field — leave inline

        try {
            $this->cancelPolicyService->suspend($policy, $request->reason);

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy'])),
                'Policy suspended successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function reinstate(Request $request, Policy $policy): JsonResponse
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->cancelPolicyService->reinstate($policy);

            return $this->respond(
                new PolicyResource($policy->fresh()->load(['customer', 'policyProduct', 'createdBy'])),
                'Policy reinstated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function convertQuote(ConvertQuoteRequest $request): JsonResponse
    {
        $quote = Quote::forTenant($request->user()->tenant_id)
            ->findOrFail($request->quote_id);

        try {
            $policy = $this->policyIssuanceService->convertQuoteToPolicy(
                $quote,
                $request->user(),
                $request->input('additional_data', [])
            );

            $policy->load(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy', 'quote']);

            return $this->respondCreated(
                new PolicyResource($policy),
                'Quote converted to policy successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }
}
