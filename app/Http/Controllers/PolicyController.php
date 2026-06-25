<?php

namespace App\Http\Controllers;

use App\Http\Requests\PolicyProductRequest;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyApproval;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Quote;
use App\Services\PolicyIssuanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    protected PolicyIssuanceService $policyIssuanceService;

    public function __construct(PolicyIssuanceService $policyIssuanceService)
    {
        $this->policyIssuanceService = $policyIssuanceService;

        $this->middleware('permission:view_policies')->only(['index', 'show', 'showIssuedPolicy', 'approvals']);
        $this->middleware('permission:create_policies')->only(['create', 'store', 'createDirect', 'storeDirect', 'convertQuote']);
        $this->middleware('permission:edit_policies')->only(['edit', 'update']);
        $this->middleware('permission:delete_policies')->only(['destroy']);
        $this->middleware('permission:approve_quotes')->only(['approve', 'reject']);
        $this->middleware('permission:manage_roles')->only(['bulkApprove', 'bulkIssue']);
    }

    public function index(Request $request): Response
    {
        $tenantId = Auth::user()->tenant_id;

        $policies = PolicyProduct::query()
            ->where('tenant_id', $tenantId)
            ->with(['policyType', 'policyClass'])
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('policyType', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->orWhereHas('policyClass', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status !== null, fn ($query) => $query->where('is_active', $request->status)
            )
            ->when($request->policy_type_id, fn ($query, $typeId) => $query->where('policy_type_id', $typeId)
            )
            ->when($request->policy_class_id, fn ($query, $classId) => $query->where('policy_class_id', $classId)
            )
            ->ordered()
            ->paginate(15)
            ->withQueryString();

        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'policy_type_id']);

        // Calculate statistics for the tenant
        $stats = [
            'total' => PolicyProduct::where('tenant_id', $tenantId)->count(),
            'active' => PolicyProduct::where('tenant_id', $tenantId)->where('is_active', true)->count(),
            'inactive' => PolicyProduct::where('tenant_id', $tenantId)->where('is_active', false)->count(),
            'total_premium' => PolicyProduct::where('tenant_id', $tenantId)->sum('base_premium'),
        ];

        return Inertia::render('policies/Index', [
            'policies' => $policies,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'policy_type_id', 'policy_class_id']),
        ]);
    }

    public function create(): Response
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id']);
        $policyProduct = PolicyProduct::active()->with('policyClass')->ordered()->get(['id', 'name', 'code', 'policy_class_id']);

        return Inertia::render('policies/Create', [
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
            'policyProduct' => $policyProduct,
        ]);
    }

    public function store(PolicyProductRequest $request): RedirectResponse
    {
        // dd('Store Policy Product');
        $data = $request->validated();

        // Assign to current tenant
        $data['tenant_id'] = Auth::user()->tenant_id;

        // Auto-calculate premium from hierarchy if not provided
        if (! isset($data['base_premium']) || empty($data['base_premium'])) {
            $policyClass = PolicyClass::with('policyType')->find($data['policy_class_id']);
            if ($policyClass && isset($policyClass->calculated_premium)) {
                $data['base_premium'] = $policyClass->calculated_premium;
            }
            if ($policyClass && isset($policyClass->calculated_commission_rate)) {
                $data['commission_rate'] = $policyClass->calculated_commission_rate;
            }
        }

        PolicyProduct::create($data);

        return redirect()->route('policies.index')->withInput()
            ->with('success', 'Policy created successfully.');
    }

    public function show(PolicyProduct $policy): Response
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->load([
            'policyType',
            'policyClass',
            'quotes.customer',
        ]);

        return Inertia::render('policies/Show', [
            'policy' => $policy,
        ]);
    }

    public function edit(PolicyProduct $policy): Response
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id']);
        $policy->load(['policyType', 'policyClass']);

        return Inertia::render('policies/Edit', [
            'policy' => $policy,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
        ]);
    }

    public function update(PolicyProductRequest $request, PolicyProduct $policy): RedirectResponse
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $data = $request->validated();

        // Ensure tenant_id is not changed
        $data['tenant_id'] = $policy->tenant_id;

        $policy->update($data);

        return redirect()->route('policies.index')
            ->with('success', 'Policy updated successfully.');
    }

    public function destroy(PolicyProduct $policy): RedirectResponse
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        if ($policy->quotes()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete policy that has associated quotes.');
        }

        $policy->delete();

        return redirect()->route('policies.index')
            ->with('success', 'Policy deleted successfully.');
    }

    public function cancel(PolicyProduct $policy): RedirectResponse
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->update(['is_active' => false]);

        return redirect()->back()
            ->with('success', 'Policy cancelled successfully.');
    }

    public function renew(PolicyProduct $policy): RedirectResponse
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        // Logic to renew policy would go here
        // For now, just reactivate it
        $policy->update(['is_active' => true]);

        return redirect()->back()
            ->with('success', 'Policy renewed successfully.');
    }

    public function downloadPdf(PolicyProduct $policy)
    {
        // Ensure tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        // Logic to generate and download policy PDF would go here
        // For now, return a simple response
        return response()->json(['message' => 'PDF generation not implemented yet']);
    }

    public function calculatePremium(Request $request)
    {
        $request->validate([
            'policy_id' => 'required|exists:policy_products,id',
            'sum_assured' => 'required|numeric|min:0',
            'factors' => 'nullable|array',
        ]);

        $policy = PolicyProduct::findOrFail($request->policy_id);
        $premium = $policy->calculatePremium($request->sum_assured, $request->factors ?? []);

        return response()->json([
            'premium' => $premium,
            'commission' => $premium * ($policy->commission_rate / 100),
        ]);
    }

    public function getByClass(PolicyClass $policyClass)
    {
        $tenantId = Auth::user()->tenant_id;

        $policies = $policyClass->policyProducts()
            ->where('tenant_id', $tenantId)
            ->active()
            ->ordered()
            ->get(['id', 'name', 'code', 'base_premium', 'min_sum_assured', 'max_sum_assured']);

        return response()->json($policies);
    }

    /**
     * Policy Issuance Methods
     */

    /**
     * Show actual issued policies (not policy products)
     */
    public function issuedPolicies(Request $request): Response
    {
        $tenantId = Auth::user()->tenant_id;

        $policies = Policy::query()
            ->where('tenant_id', $tenantId)
            ->with(['customer', 'insuranceProduct', 'policyType', 'policyClass', 'createdBy'])
            ->when($request->search, fn ($query, $search) => $query->where('policy_number', 'like', "%{$search}%")
                ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->orWhereHas('insuranceProduct', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->approval_status, fn ($query, $status) => $query->where('approval_status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total' => Policy::where('tenant_id', $tenantId)->count(),
            'active' => Policy::where('tenant_id', $tenantId)->active()->count(),
            'pending' => Policy::where('tenant_id', $tenantId)->pendingApproval()->count(),
            'expired' => Policy::where('tenant_id', $tenantId)->expired()->count(),
        ];

        return Inertia::render('policies/IssuedPolicies', [
            'policies' => $policies,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'approval_status']),
        ]);
    }

    /**
     * Create policy directly (Underwriter level)
     */
    public function createDirect(): Response
    {
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->orderBy('id')
            ->get(['id', 'first_name', 'last_name', 'company_name', 'email', 'phone']);

        $policyProducts = PolicyProduct::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->with(['policyType', 'policyClass'])
            ->orderBy('name')
            ->get();

        return Inertia::render('policies/CreateDirect', [
            'customers' => $customers,
            'policyProducts' => $policyProducts,
        ]);
    }

    /**
     * Store directly created policy
     */
    public function storeDirect(Request $request): RedirectResponse
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'insurance_product_id' => 'required|exists:policy_products,id',
            'policy_class_id' => 'nullable|exists:policy_classes,id',
            'policy_type_id' => 'nullable|exists:policy_types,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'expiry_date' => 'required|date|after:effective_date',
            'premium_amount' => 'required|numeric|min:0',
            'commission_amount' => 'nullable|numeric|min:0',
            'coverage_details' => 'required|array',
            'payment_frequency' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual'])],
            'form_data' => 'nullable|array',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $policyData = $request->validated();
            $policyData['total_amount'] = $policyData['premium_amount'] + ($policyData['commission_amount'] ?? 0);

            $policy = $this->policyIssuanceService->createDirectPolicy($policyData, Auth::user());

            return redirect()->route('policies.issued.show', $policy)
                ->with('success', 'Policy created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Error creating policy: '.$e->getMessage());
        }
    }

    /**
     * Convert quote to policy
     */
    public function convertQuote(Request $request): JsonResponse
    {
        $request->validate([
            'quote_id' => 'required|exists:quotes,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'expiry_date' => 'required|date|after:effective_date',
            'payment_frequency' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual'])],
        ]);

        try {
            $quote = Quote::findOrFail($request->quote_id);

            // Check tenant access
            if ($quote->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $additionalData = $request->only(['effective_date', 'expiry_date', 'payment_frequency']);
            $policy = $this->policyIssuanceService->convertQuoteToPolicy($quote, Auth::user(), $additionalData);

            return response()->json([
                'success' => true,
                'message' => 'Quote converted to policy successfully.',
                'policy' => $policy,
                'redirect_url' => route('policies.issued.show', $policy),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Submit policy for approval (Broker level)
     */
    public function submitForApproval(Request $request): JsonResponse
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $policy = Policy::findOrFail($request->policy_id);

            // Check tenant access
            if ($policy->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $approval = $this->policyIssuanceService->submitPolicyForApproval(
                $policy,
                Auth::user(),
                $request->notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Policy submitted for approval successfully.',
                'approval' => $approval,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Show policy approvals
     */
    public function approvals(Request $request): Response
    {
        $tenantId = Auth::user()->tenant_id;

        $approvals = PolicyApproval::query()
            ->where('tenant_id', $tenantId)
            ->with(['policy.customer', 'policy.insuranceProduct', 'requestedBy', 'approvedBy'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->approval_type, fn ($query, $type) => $query->where('approval_type', $type))
            ->latest('requested_at')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'pending' => PolicyApproval::where('tenant_id', $tenantId)->pending()->count(),
            'under_review' => PolicyApproval::where('tenant_id', $tenantId)->underReview()->count(),
            'approved' => PolicyApproval::where('tenant_id', $tenantId)->approved()->count(),
            'rejected' => PolicyApproval::where('tenant_id', $tenantId)->rejected()->count(),
        ];

        return Inertia::render('policies/Approvals', [
            'approvals' => $approvals,
            'stats' => $stats,
            'filters' => $request->only(['status', 'approval_type']),
        ]);
    }

    /**
     * Approve policy
     */
    public function approve(Request $request): JsonResponse
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $policy = Policy::findOrFail($request->policy_id);

            // Check tenant access and permissions
            if ($policy->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $this->policyIssuanceService->approvePolicy($policy, Auth::user(), $request->notes);

            return response()->json([
                'success' => true,
                'message' => 'Policy approved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject policy
     */
    public function reject(Request $request): JsonResponse
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $policy = Policy::findOrFail($request->policy_id);

            // Check tenant access and permissions
            if ($policy->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $this->policyIssuanceService->rejectPolicy($policy, Auth::user(), $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Policy rejected successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Issue approved policy
     */
    public function issue(Request $request): JsonResponse
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id',
        ]);

        try {
            $policy = Policy::findOrFail($request->policy_id);

            // Check tenant access
            if ($policy->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $this->policyIssuanceService->issuePolicy($policy);

            return response()->json([
                'success' => true,
                'message' => 'Policy issued successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk approve policies
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate([
            'policy_ids' => 'required|array',
            'policy_ids.*' => 'exists:policies,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $results = [];
            $tenantId = Auth::user()->tenant_id;

            foreach ($request->policy_ids as $policyId) {
                try {
                    $policy = Policy::findOrFail($policyId);

                    if ($policy->tenant_id !== $tenantId) {
                        $results[$policyId] = ['status' => 'error', 'message' => 'Unauthorized access'];

                        continue;
                    }

                    $this->policyIssuanceService->approvePolicy($policy, Auth::user(), $request->notes);
                    $results[$policyId] = ['status' => 'success', 'message' => 'Approved successfully'];
                } catch (\Exception $e) {
                    $results[$policyId] = ['status' => 'error', 'message' => $e->getMessage()];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Bulk approval completed.',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk issue policies
     */
    public function bulkIssue(Request $request): JsonResponse
    {
        $request->validate([
            'policy_ids' => 'required|array',
            'policy_ids.*' => 'exists:policies,id',
        ]);

        try {
            $results = $this->policyIssuanceService->bulkIssue($request->policy_ids, Auth::user());

            return response()->json([
                'success' => true,
                'message' => 'Bulk issuance completed.',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Show issued policy details
     */
    public function showIssuedPolicy(Policy $policy): Response
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->load([
            'customer',
            'insuranceProduct',
            'policyType',
            'policyClass',
            'createdBy',
            'approvedBy',
            'quote',
            'approvals.requestedBy',
            'approvals.approvedBy',
            'amendments',
            'documents',
            'financialNotes',
        ]);

        return Inertia::render('policies/ShowIssued', [
            'policy' => $policy,
        ]);
    }
}
