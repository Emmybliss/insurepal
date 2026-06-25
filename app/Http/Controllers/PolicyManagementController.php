<?php

namespace App\Http\Controllers;

use App\Http\Requests\IssuePolicyRequest;
use App\Http\Requests\PolicyUpdateRequest;
use App\Http\Requests\RecordPlacedPolicyRequest;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\PolicyAmendment;
use App\Models\PolicyApproval;
use App\Models\PolicyProduct;
use App\Models\Quote;
use App\Services\PolicyIssuanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PolicyManagementController extends Controller
{
    protected PolicyIssuanceService $policyIssuanceService;

    public function __construct(PolicyIssuanceService $policyIssuanceService)
    {
        $this->policyIssuanceService = $policyIssuanceService;

        $this->middleware('permission:view_policies')->only(['index', 'show', 'approvals', 'recordedPolicies']);
        $this->middleware('permission:create_policies')->only(['createDirect', 'storeDirect', 'convertQuote']);
        $this->middleware('permission:edit_policies')->only(['edit', 'update']);
        $this->middleware('permission:delete_policies')->only(['destroy']);
        $this->middleware('permission:approve_policies')->only(['approve', 'reject']);
        $this->middleware('permission:manage_roles')->only(['bulkApprove', 'bulkIssue']);

        // Tenant type enforcement
        $this->middleware('tenant.type:underwriter')->only([
            'issue', 'bulkIssue',
            'approve', 'reject', 'bulkApprove', 'submitForApproval',
            'approveAmendment', 'activateAmendment',
        ]);
        $this->middleware('tenant.type:broker')->only(['recordedPolicies']);
    }

    /**
     * Show actual issued policies (not policy products)
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;

        // If the logged-in user is a customer, scope to their records only
        $customerScope = null;
        if ($user->hasRole('customer')) {
            $customerScope = \App\Models\Customer::where('user_id', $user->id)->value('id');
        }

        $policies = Policy::query()
            ->where('tenant_id', $tenantId)
            ->when($customerScope, fn ($q) => $q->where('customer_id', $customerScope))
            ->with(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy'])
            ->when($request->search, fn ($query, $search) => $query->where('policy_number', 'like', "%{$search}%")
                ->orWhereHas('customer', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                )
                ->orWhereHas('policyProduct', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status, function ($query, $status) {
                if ($status === \App\Models\Policy::STATUS_ACTIVE) {
                    $query->active();
                } elseif ($status === \App\Models\Policy::STATUS_EXPIRED) {
                    $query->expired();
                } else {
                    $query->where('status', $status);
                }
            })
            ->when($request->approval_status, fn ($query, $status) => $query->where('approval_status', $status))
            ->when($request->expiring_soon, fn ($query) => $query->expiring(60))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $baseQuery = Policy::where('tenant_id', $tenantId)
            ->when($customerScope, fn ($q) => $q->where('customer_id', $customerScope));

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->active()->count(),
            'pending' => (clone $baseQuery)->pendingApproval()->count(),
            'expired' => (clone $baseQuery)->expired()->count(),
            'expiring_soon' => (clone $baseQuery)->expiring(60)->count(),
        ];

        return Inertia::render('policies/IssuedPolicies', [
            'policies' => $policies,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'approval_status']),
        ]);
    }

    /**
     * Show recorded policies for broker tenant
     */
    public function recordedPolicies(Request $request): Response
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;

        $policies = Policy::query()
            ->where('tenant_id', $tenantId)
            ->where('source_type', Policy::SOURCE_BROKER_RECORDED)
            ->with(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy'])
            ->when($request->search, fn ($query, $search) => $query->where('policy_number', 'like', "%{$search}%")
                ->orWhereHas('customer', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                )
                ->orWhereHas('policyProduct', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->active();
                } elseif ($status === 'expired') {
                    $query->expired();
                } else {
                    $query->where('status', $status);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $baseQuery = Policy::where('tenant_id', $tenantId)
            ->where('source_type', Policy::SOURCE_BROKER_RECORDED);

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->active()->count(),
            'recorded' => (clone $baseQuery)->where('status', Policy::STATUS_RECORDED)->count(),
            'expired' => (clone $baseQuery)->expired()->count(),
        ];

        return Inertia::render('policies/RecordedPolicies', [
            'policies' => $policies,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Create policy directly (Underwriter level)
     */
    public function createDirect(): Response
    {
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->orderBy('company_name')
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type', 'email', 'phone'])
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->display_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'type' => $customer->type,
                ];
            });

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
     * Show form for broker to record a placed policy
     */
    public function createRecordPlaced(): Response
    {
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->orderBy('company_name')
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type', 'email', 'phone'])
            ->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->display_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'type' => $customer->type,
            ]);

        $policyProducts = PolicyProduct::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->with(['policyType', 'policyClass', 'preferredUnderwriters'])
            ->orderBy('name')
            ->get();

        return Inertia::render('policies/RecordPlacedPolicy', [
            'customers' => $customers,
            'policyProducts' => $policyProducts,
        ]);
    }

    /**
     * Store a broker-recorded placed policy
     */
    public function storeRecordPlaced(RecordPlacedPolicyRequest $request): RedirectResponse
    {
        try {
            $policyData = $request->safe()->except(['schedule_file', 'broker_slip_file']);
            $policyData['total_amount'] = ($policyData['premium_amount'] ?? 0) + ($policyData['commission_amount'] ?? 0);

            $policy = $this->policyIssuanceService->recordPlacedPolicy(
                $policyData,
                Auth::user(),
                $request->file('schedule_file'),
                $request->file('broker_slip_file'),
            );

            return redirect()->route('policy-management.show', $policy)
                ->with('success', 'Placed policy recorded successfully.');
        } catch (\Exception $e) {
            Log::error('Error recording placed policy: '.$e->getMessage());

            return back()
                ->withInput()
                ->with('error', 'Error recording policy: '.$e->getMessage());
        }
    }

    /**
     * Store directly created policy
     */
    public function storeDirect(IssuePolicyRequest $request): RedirectResponse
    {

        try {
            $policyData = $request->only([
                'customer_id', 'policy_product_id', 'policy_class_id',
                'policy_type_id', 'effective_date', 'expiry_date', 'premium_amount',
                'commission_amount', 'coverage_details', 'payment_frequency', 'form_data', 'notes',
                'insurer_id', 'insurer_source', 'insurer_name', 'insurer_address',
                'insurer_email', 'insurer_phone',
            ]);

            $policyData['total_amount'] = $policyData['premium_amount'] + ($policyData['commission_amount'] ?? 0);

            $policy = $this->policyIssuanceService->createDirectPolicy($policyData, Auth::user());

            return redirect()->route('policy-management.show', $policy)
                ->with('success', 'Policy created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating policy: '.$e->getMessage());
            dd(old()); // place here if you want to check old input

            return back()
                ->withInput()
                ->with('error', 'Error creating policy: '.$e->getMessage());
        }
    }

    /**
     * Show policy details
     */
    public function show(Policy $policy): Response
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->load([
            'customer',
            'policyProduct',
            'policyType',
            'policyClass',
            'createdBy',
            'approvedBy',
            'quote',
            'approvals.requestedBy',
            'approvals.approvedBy',
            'amendments',
            'documents',
            'creditNotes',
            'debitNotes',
            'invoices',
            'receipts',
            'issuedBy',
            'brokerTenant',
        ]);

        return Inertia::render('policies/Show', [
            'policy' => $policy,
        ]);
    }

    /**
     * Show edit form for issued policy
     */
    public function edit(Policy $policy): Response
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->load(['customer', 'policyProduct']);

        return Inertia::render('policies/EditIssued', [
            'policy' => $policy,
        ]);
    }

    /**
     * Update issued policy (manual edit)
     */
    public function update(PolicyUpdateRequest $request, Policy $policy): RedirectResponse
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $policy->update($request->validated());

        return redirect()->route('policy-management.show', $policy)
            ->with('success', 'Policy updated successfully.');
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
                'redirect_url' => route('policy-management.show', $policy),
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
            ->with(['policy.customer', 'policy.policyProduct', 'requestedBy', 'approvedBy'])
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
            Log::error('Error issuing policy: '.$e->getMessage());

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
     * Show amendment form for a policy
     */
    public function showAmendForm(Policy $policy): Response|RedirectResponse
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        // Check if policy can be amended
        if (! $policy->canBeAmended()) {
            return redirect()->back()->with('error', 'This policy cannot be amended in its current status.');
        }

        $policy->load([
            'customer',
            'policyProduct',
            'policyType',
            'policyClass',
            'amendments' => function ($query) {
                $query->latest();
            },
        ]);

        return Inertia::render('policies/AmendForm', [
            'policy' => $policy,
        ]);
    }

    /**
     * Store a new policy amendment
     */
    public function storeAmendment(Request $request, Policy $policy): RedirectResponse
    {
        // Check tenant access
        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $request->validate([
            'amendment_type' => 'required|in:coverage_change,premium_adjustment,beneficiary_change,policy_details_update,term_extension,endorsement,correction',
            'amendment_reason' => 'required|string|max:1000',
            'effective_date' => 'required|date|after_or_equal:today',
            'customer_notes' => 'nullable|string|max:500',

            // Dynamic fields based on amendment type
            'coverage_details' => 'nullable|array',
            'new_premium_amount' => 'nullable|numeric|min:0',
            'new_expiry_date' => 'nullable|date|after:'.$policy->expiry_date,
            'payment_frequency' => 'nullable|in:monthly,quarterly,semi_annual,annual',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            // Store original policy data
            $originalData = $policy->only([
                'coverage_details', 'premium_amount', 'total_amount', 'expiry_date',
                'payment_frequency', 'notes',
            ]);

            // Prepare amended data based on amendment type
            $amendedData = $this->prepareAmendedData($request, $policy);

            // Calculate premium adjustment if applicable
            $premiumAdjustment = 0;
            $newPremiumAmount = $policy->premium_amount;

            if ($request->amendment_type === 'premium_adjustment' && $request->new_premium_amount) {
                $newPremiumAmount = $request->new_premium_amount;
                $premiumAdjustment = $newPremiumAmount - $policy->premium_amount;
            }

            // Create amendment record
            $amendment = PolicyAmendment::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'amendment_type' => $request->amendment_type,
                'status' => PolicyAmendment::STATUS_DRAFT,
                'original_data' => $originalData,
                'amended_data' => $amendedData,
                'changes_summary' => $this->generateChangesSummary($originalData, $amendedData),
                'premium_adjustment' => $premiumAdjustment,
                'new_premium_amount' => $newPremiumAmount,
                'effective_date' => $request->effective_date,
                'amendment_reason' => $request->amendment_reason,
                'customer_notes' => $request->customer_notes,
                'created_by' => Auth::id(),
            ]);

            return redirect()->route('policy-management.show', $policy)
                ->with('success', 'Amendment created successfully and is pending approval.');

        } catch (\Exception $e) {
            Log::error('Error creating policy amendment: '.$e->getMessage());

            return redirect()->back()
                ->withInput()
                ->with('error', 'Error creating amendment: '.$e->getMessage());
        }
    }

    /**
     * Submit amendment for approval
     */
    public function submitAmendment(Request $request): JsonResponse
    {
        $request->validate([
            'amendment_id' => 'required|exists:policy_amendments,id',
        ]);

        try {
            $amendment = PolicyAmendment::findOrFail($request->amendment_id);

            // Check tenant access
            if ($amendment->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $amendment->submitForApproval();

            return response()->json([
                'success' => true,
                'message' => 'Amendment submitted for approval successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Approve an amendment
     */
    public function approveAmendment(Request $request): JsonResponse
    {
        $request->validate([
            'amendment_id' => 'required|exists:policy_amendments,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $amendment = PolicyAmendment::findOrFail($request->amendment_id);

            // Check tenant access and permissions
            if ($amendment->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $amendment->approve(Auth::user(), $request->notes);

            return response()->json([
                'success' => true,
                'message' => 'Amendment approved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Activate an approved amendment
     */
    public function activateAmendment(Request $request): JsonResponse
    {
        $request->validate([
            'amendment_id' => 'required|exists:policy_amendments,id',
        ]);

        try {
            $amendment = PolicyAmendment::findOrFail($request->amendment_id);

            // Check tenant access and permissions
            if ($amendment->tenant_id !== Auth::user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }

            $amendment->activate();

            return response()->json([
                'success' => true,
                'message' => 'Amendment activated successfully. Policy has been updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Prepare amended data based on amendment type
     */
    private function prepareAmendedData(Request $request, Policy $policy): array
    {
        $amendedData = [];

        switch ($request->amendment_type) {
            case 'coverage_change':
                if ($request->has('coverage_details')) {
                    $amendedData['coverage_details'] = $request->coverage_details;
                }
                break;

            case 'premium_adjustment':
                if ($request->has('new_premium_amount')) {
                    $amendedData['premium_amount'] = $request->new_premium_amount;
                    $amendedData['total_amount'] = $request->new_premium_amount + $policy->commission_amount;
                }
                break;

            case 'term_extension':
                if ($request->has('new_expiry_date')) {
                    $amendedData['expiry_date'] = $request->new_expiry_date;
                }
                break;

            case 'policy_details_update':
                $updatableFields = ['payment_frequency', 'notes'];
                foreach ($updatableFields as $field) {
                    if ($request->has($field)) {
                        $amendedData[$field] = $request->$field;
                    }
                }
                break;

            case 'endorsement':
                if ($request->has('coverage_details')) {
                    $amendedData['coverage_details'] = array_merge(
                        $policy->coverage_details ?? [],
                        $request->coverage_details
                    );
                }
                break;
        }

        return $amendedData;
    }

    /**
     * Generate changes summary for amendment
     */
    private function generateChangesSummary(array $originalData, array $amendedData): array
    {
        $changes = [];

        foreach ($amendedData as $key => $newValue) {
            $originalValue = $originalData[$key] ?? null;

            if ($originalValue !== $newValue) {
                $changes[] = [
                    'field' => $key,
                    'from' => $originalValue,
                    'to' => $newValue,
                    'field_label' => ucwords(str_replace('_', ' ', $key)),
                ];
            }
        }

        return $changes;
    }

    /**
     * One-click: auto-create a Debit Note from policy data and return preview URL.
     */
    public function quickCreateDebitNote(Policy $policy): JsonResponse
    {
        if ($policy->tenant_id != Auth::user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $tenantId = $policy->tenant_id;
            $year = now()->year;

            $lastNote = DebitNote::withTrashed()->where('tenant_id', $tenantId)->latest('id')->first();
            $lastNumber = $lastNote ? intval(substr($lastNote->note_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
            $referenceNum = sprintf('DN-%d-%d-%06d', $year, $tenantId, $newNumber);

            $policy->load('customer');

            $registry = config('document-templates.templates', []);
            $debitNoteTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'debit_note');
            $templateKey = array_key_first($debitNoteTemplates);

            $lastSequence = DebitNote::withTrashed()->where('tenant_id', $tenantId)->latest('id')->first();
            $sequenceNumber = $lastSequence ? $lastSequence->sequence_number + 1 : 1;

            $note = DebitNote::create([
                'note_number' => $newNumber,
                'reference_number' => $referenceNum,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'amount' => $policy->premium_amount ?? 0,
                'tax_amount' => 0,
                'total_amount' => $policy->premium_amount ?? 0,
                'description' => 'Debit Note for Policy #'.$policy->policy_number,
                'issue_date' => now()->format('Y-m-d'),
                'due_date' => now()->addDays(30)->format('Y-m-d'),
                'created_by_id' => Auth::id(),
                'status' => 'draft',
                'currency_code' => 'NGN',
                'premium_breakdown' => $policy->coverage_details,
            ]);

            return response()->json([
                'success' => true,
                'note_id' => $note->id,
                'note_number' => $note->note_number,
                'preview_url' => route('debit-notes.html-preview', $note->id),
                'download_url' => route('debit-notes.download-pdf', $note->id),
            ]);
        } catch (\Exception $e) {
            Log::error('Quick create debit note failed: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * One-click: auto-create a Credit Note from policy data and return preview URL.
     */
    public function quickCreateCreditNote(Policy $policy): JsonResponse
    {
        if ($policy->tenant_id != Auth::user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $tenantId = $policy->tenant_id;
            $year = now()->year;

            $lastNote = CreditNote::withTrashed()->where('tenant_id', $tenantId)->latest('id')->first();
            $lastNumber = $lastNote ? intval(substr($lastNote->note_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
            $referenceNum = sprintf('CN-%d-%d-%06d', $year, $tenantId, $newNumber);

            $policy->load('customer');

            $registry = config('document-templates.templates', []);
            $creditNoteTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'credit_note');
            $templateKey = array_key_first($creditNoteTemplates);

            $lastSequence = CreditNote::withTrashed()->where('tenant_id', $tenantId)->latest('id')->first();
            $sequenceNumber = $lastSequence ? $lastSequence->sequence_number + 1 : 1;

            $note = CreditNote::create([
                'note_number' => $newNumber,
                'reference_number' => $referenceNum,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'amount' => $policy->premium_amount ?? 0,
                'tax_amount' => 0,
                'total_amount' => $policy->premium_amount ?? 0,
                'description' => 'Credit Note for Policy #'.$policy->policy_number,
                'issue_date' => now()->format('Y-m-d'),
                'created_by_id' => Auth::id(),
                'status' => 'draft',
                'currency_code' => 'NGN',
            ]);

            return response()->json([
                'success' => true,
                'note_id' => $note->id,
                'note_number' => $note->note_number,
                'preview_url' => route('credit-notes.html-preview', $note->id),
                'download_url' => route('credit-notes.download-pdf', $note->id),
            ]);
        } catch (\Exception $e) {
            Log::error('Quick create credit note failed: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Quick create an invoice for a policy (one-click)
     */
    public function quickCreateInvoice(Policy $policy): JsonResponse
    {
        if ($policy->tenant_id != Auth::user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            DB::beginTransaction();

            $policy->load(['customer', 'policyProduct']);

            // Fetch default template for invoices
            $registry = config('document-templates.templates', []);
            $invoiceTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'invoice');
            $defaultTemplateKey = array_key_first($invoiceTemplates);

            if (! $defaultTemplateKey) {
                throw new \Exception('No invoice template found.');
            }

            // Generate Invoice Number
            $lastInvoice = \App\Models\Invoice::withTrashed()->where('tenant_id', $policy->tenant_id)->latest('id')->first();
            $lastNumber = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

            $invoice = \App\Models\Invoice::create([
                'invoice_number' => $newNumber,
                'tenant_id' => $policy->tenant_id,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'user_id' => Auth::id(),
                'total_amount' => $policy->premium_amount,
                'subtotal' => $policy->premium_amount,
                'tax_amount' => 0,
                'status' => 'draft',
                'due_date' => now()->addDays(14),
                'currency' => 'NGN',
                'billing_address' => null,
            ]);

            // Add an item for the premium
            $invoice->items()->create([
                'description' => "Premium for policy #{$policy->policy_number}",
                'quantity' => 1,
                'unit_price' => $policy->premium_amount,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'discount_rate' => 0,
                'discount_amount' => 0,
                'total' => $policy->premium_amount,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'redirect_url' => route('invoices.template-options', $invoice->id),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Quick create invoice failed: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Quick create a receipt for a policy (one-click)
     */
    public function quickCreateReceipt(Policy $policy): JsonResponse
    {
        if ($policy->tenant_id != Auth::user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $policy->load(['customer']);

            $policy->load(['customer']);

            // Fetch default template for receipts
            $registry = config('document-templates.templates', []);
            $receiptTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'receipt');
            $defaultTemplateKey = array_key_first($receiptTemplates);

            if (! $defaultTemplateKey) {
                throw new \Exception('No receipt template found.');
            }

            // A receipt MUST belong to an invoice according to DB constraints
            $invoice = $policy->invoices()->latest()->first();

            if (! $invoice) {
                // If no invoice, create a quick draft invoice first
                $lastInvoice = \App\Models\Invoice::withTrashed()->where('tenant_id', $policy->tenant_id)->latest('id')->first();
                $lastNumber = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -6)) : 0;
                $newInvNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

                $invoice = \App\Models\Invoice::create([
                    'invoice_number' => $newInvNumber,
                    'tenant_id' => $policy->tenant_id,
                    'customer_id' => $policy->customer_id,
                    'policy_id' => $policy->id,
                    'user_id' => Auth::id(),
                    'total_amount' => $policy->premium_amount,
                    'subtotal' => $policy->premium_amount,
                    'status' => 'draft',
                    'due_date' => now(),
                    'currency' => 'NGN',
                ]);
            }

            $receiptNumber = \App\Models\Receipt::generateReceiptNumber($policy->tenant_id);

            $receipt = \App\Models\Receipt::create([
                'receipt_number' => $receiptNumber,
                'tenant_id' => $policy->tenant_id,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'invoice_id' => $invoice->id,
                'payment_date' => now(),
                'payment_method' => 'other',
                'amount_paid' => $policy->premium_amount,
                'currency' => 'NGN',
                'payment_status' => 'pending',
                'notes' => "Quick receipt generated for policy #{$policy->policy_number}",
            ]);

            return response()->json([
                'success' => true,
                'receipt_id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'redirect_url' => route('receipts.template-options', $receipt->id),
            ]);
        } catch (\Exception $e) {
            Log::error('Quick create receipt failed: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
