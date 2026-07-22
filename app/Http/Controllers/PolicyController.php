<?php

namespace App\Http\Controllers;

use App\Http\Requests\PolicyDirectStoreRequest;
use App\Http\Requests\PolicyProductRequest;
use App\Http\Requests\PolicyQuoteRequest;
use App\Http\Requests\PolicyWorkflowRequest;
use App\Models\Policy;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\Quote;
use App\Services\Policies\PolicyApprovalService;
use App\Services\Policies\PolicyListingService;
use App\Services\Policies\PolicyProductService;
use App\Services\PolicyIssuanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function __construct(
        protected PolicyProductService $policyProductService,
        protected PolicyListingService $policyListingService,
        protected PolicyApprovalService $policyApprovalService,
        protected PolicyIssuanceService $policyIssuanceService,
    ) {
        $this->middleware('permission:view_policies')->only(['index', 'showIssuedPolicy', 'approvals']);
        $this->middleware('permission:create_policies')->only(['create', 'store', 'createDirect', 'storeDirect', 'convertQuote']);
        $this->middleware('permission:edit_policies')->only(['edit', 'update']);
        $this->middleware('permission:delete_policies')->only(['destroy']);
        $this->middleware('permission:approve_quotes')->only(['approve', 'reject']);
        $this->middleware('permission:manage_roles')->only(['bulkApprove', 'bulkIssue']);
    }

    public function index(Request $request): Response
    {
        return Inertia::render('policies/Index', $this->policyProductService->list(
            $request->user(), $request->only(['search', 'status', 'policy_type_id', 'policy_class_id'])
        ));
    }

    public function create(): Response
    {
        return Inertia::render('policies/Create', $this->policyProductService->getCreateData(request()->user()));
    }

    public function store(PolicyProductRequest $request): RedirectResponse
    {
        $this->policyProductService->store($request->validated(), $request->user());

        return redirect()->route('policies.index')->with('success', 'Policy created successfully.');
    }

    public function edit(PolicyProduct $policy): Response
    {
        return Inertia::render('policies/Edit', $this->policyProductService->getEditData($policy, request()->user()));
    }

    public function update(PolicyProductRequest $request, PolicyProduct $policy): RedirectResponse
    {
        $this->policyProductService->update($policy, $request->validated());

        return redirect()->route('policies.index')->with('success', 'Policy updated successfully.');
    }

    public function destroy(PolicyProduct $policy): RedirectResponse
    {
        try {
            $this->policyProductService->delete($policy);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('policies.index')->with('success', 'Policy deleted successfully.');
    }

    public function cancel(PolicyProduct $policy): RedirectResponse
    {
        $this->policyProductService->toggleActive($policy, false);

        return redirect()->back()->with('success', 'Policy cancelled successfully.');
    }

    public function renew(PolicyProduct $policy): RedirectResponse
    {
        $this->policyProductService->toggleActive($policy, true);

        return redirect()->back()->with('success', 'Policy renewed successfully.');
    }

    public function downloadPdf(PolicyProduct $policy): JsonResponse
    {
        return response()->json(['message' => 'PDF generation not implemented yet']);
    }

    public function calculatePremium(PolicyQuoteRequest $request): JsonResponse
    {

        return response()->json($this->policyProductService->calculatePremium(
            PolicyProduct::findOrFail($request->policy_id), $request->sum_assured, $request->factors ?? []
        ));
    }

    public function getByClass(PolicyClass $policyClass): JsonResponse
    {
        return response()->json($this->policyProductService->getByClass($policyClass, request()->user()));
    }

    public function issuedPolicies(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'approval_status', 'source_type', 'customer_id', 'policy_product_id', 'date_from', 'date_to', 'active', 'expiring', 'expiring_days', 'sort']);

        return Inertia::render('policies/IssuedPolicies', [
            'policies' => $this->policyListingService->list($request->user(), $filters),
            'stats' => $this->policyListingService->getStats($request->user()),
            'filters' => $request->only(['search', 'status', 'approval_status']),
        ]);
    }

    public function createDirect(): Response
    {
        return Inertia::render('policies/CreateDirect', $this->policyListingService->getDirectCreateData(request()->user()));
    }

    public function storeDirect(PolicyDirectStoreRequest $request): RedirectResponse
    {
        try {
            $policyData = $request->validated();
            $policyData['total_amount'] = ($policyData['premium_amount'] ?? 0) + ($policyData['commission_amount'] ?? 0);

            return redirect()->route('policies.issued.show', $this->policyIssuanceService->createDirectPolicy($policyData, $request->user()))
                ->with('success', 'Policy created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', 'Error creating policy: '.$e->getMessage());
        }
    }

    public function convertQuote(PolicyWorkflowRequest $request): JsonResponse
    {
        try {
            $policy = $this->policyIssuanceService->convertQuoteToPolicy(
                Quote::forTenant($request->user()->tenant_id)->findOrFail($request->quote_id),
                $request->user(),
                $request->only(['effective_date', 'expiry_date', 'payment_frequency'])
            );

            return response()->json(['success' => true, 'message' => 'Quote converted to policy successfully.', 'policy' => $policy, 'redirect_url' => route('policies.issued.show', $policy)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    public function submitForApproval(PolicyWorkflowRequest $request): JsonResponse
    {
        try {
            $approval = $this->policyIssuanceService->submitPolicyForApproval(
                Policy::forTenant($request->user()->tenant_id)->findOrFail($request->policy_id),
                $request->user(),
                $request->notes
            );

            return response()->json(['success' => true, 'message' => 'Policy submitted for approval successfully.', 'approval' => $approval]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    public function approvals(Request $request): Response
    {
        return Inertia::render('policies/Approvals', $this->policyApprovalService->list(
            $request->user(), $request->only(['status', 'approval_type'])
        ));
    }

    public function approve(PolicyWorkflowRequest $request): JsonResponse
    {
        return $this->workflow('Policy approved successfully.', fn () => $this->policyIssuanceService->approvePolicy(Policy::forTenant($request->user()->tenant_id)->findOrFail($request->policy_id), $request->user(), $request->notes)
        );
    }

    public function reject(PolicyWorkflowRequest $request): JsonResponse
    {
        return $this->workflow('Policy rejected successfully.', fn () => $this->policyIssuanceService->rejectPolicy(Policy::forTenant($request->user()->tenant_id)->findOrFail($request->policy_id), $request->user(), $request->reason)
        );
    }

    public function issue(PolicyWorkflowRequest $request): JsonResponse
    {
        return $this->workflow('Policy issued successfully.', fn () => $this->policyIssuanceService->issuePolicy(Policy::forTenant($request->user()->tenant_id)->findOrFail($request->policy_id))
        );
    }

    public function bulkApprove(PolicyWorkflowRequest $request): JsonResponse
    {
        return $this->workflowWithResults('Bulk approval completed.', fn () => $this->policyIssuanceService->bulkApprove($request->policy_ids, $request->user(), $request->notes)
        );
    }

    public function bulkIssue(PolicyWorkflowRequest $request): JsonResponse
    {
        return $this->workflowWithResults('Bulk issuance completed.', fn () => $this->policyIssuanceService->bulkIssue($request->policy_ids, $request->user())
        );
    }

    public function showIssuedPolicy(Policy $policy): Response
    {
        return Inertia::render('policies/ShowIssued', [
            'policy' => $policy->load(['customer', 'insuranceProduct', 'policyType', 'policyClass', 'createdBy', 'approvedBy', 'quote', 'approvals.requestedBy', 'approvals.approvedBy', 'amendments', 'documents', 'financialNotes']),
        ]);
    }

    private function workflow(string $message, callable $callback): JsonResponse
    {
        try {
            $callback();

            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    private function workflowWithResults(string $message, callable $callback): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'message' => $message, 'results' => $callback()]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }
}
