<?php

namespace App\Http\Controllers;

use App\Events\ClaimStatusChanged;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Notifications\AdditionalInfoRequested;
use App\Notifications\ClaimApproved;
use App\Notifications\ClaimRejected;
use App\Notifications\ClaimStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ClaimController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Claim::class);

        $query = Claim::query()
            ->with(['customer', 'policy', 'submittedBy', 'reviewer'])
            ->where('tenant_id', auth()->user()->tenant_id);

        // Filter by customer if user is a customer
        if (auth()->user()->hasRole('customer')) {
            $query->where('customer_id', auth()->user()->customer?->id);
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('claim_type')) {
            $query->where('claim_type', $request->claim_type);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('claim_reference', 'like', "%{$request->search}%")
                    ->orWhere('incident_description', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('first_name', 'like', "%{$request->search}%")
                            ->orWhere('last_name', 'like', "%{$request->search}%")
                            ->orWhere('company_name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('incident_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('incident_date', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $claims = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        // Get statistics - scope to customer if customer role
        $statsBase = Claim::where('tenant_id', auth()->user()->tenant_id);
        if (auth()->user()->hasRole('customer')) {
            $statsBase->where('customer_id', auth()->user()->customer?->id);
        }

        $stats = [
            'total' => (clone $statsBase)->count(),
            'pending' => (clone $statsBase)->pending()->count(),
            'approved' => (clone $statsBase)->approved()->count(),
            'rejected' => (clone $statsBase)->rejected()->count(),
            'settled' => (clone $statsBase)->settled()->count(),
        ];

        return Inertia::render('Claims/Index', [
            'claims' => $claims,
            'stats' => $stats,
            'filters' => $request->only(['status', 'claim_type', 'search', 'date_from', 'date_to', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', Claim::class);

        $user = auth()->user();

        // For customers: only show their own active policies
        if ($user->hasRole('customer')) {
            $customer = Customer::where('user_id', $user->id)->first();

            $policies = $customer
                ? Policy::where('tenant_id', $user->tenant_id)
                    ->where('customer_id', $customer->id)
                    ->where('status', Policy::STATUS_ACTIVE)
                    ->with(['customer', 'policyProduct'])
                    ->get()
                : collect();

            return Inertia::render('Claims/Create', [
                'policies' => $policies,
                'customers' => $customer ? collect([$customer]) : collect(),
                'claimTypes' => $this->getClaimTypes(),
                'documentTypes' => $this->getDocumentTypes(),
            ]);
        }

        $policies = Policy::where('tenant_id', $user->tenant_id)
            ->where('status', Policy::STATUS_ACTIVE)
            ->with(['customer', 'policyProduct'])
            ->get();

        $customers = Customer::where('tenant_id', $user->tenant_id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Claims/Create', [
            'policies' => $policies,
            'customers' => $customers,
            'claimTypes' => $this->getClaimTypes(),
            'documentTypes' => $this->getDocumentTypes(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Claim::class);

        $validated = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'customer_id' => 'required|exists:customers,id',
            'claim_type' => 'required|in:accident,theft,damage,fire,flood,medical,death,disability,liability,other',
            'incident_date' => 'required|date|before_or_equal:today',
            'incident_description' => 'required|string|min:10',
            'incident_location' => 'nullable|string|max:255',
            'claim_amount' => 'required|numeric|min:0',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        DB::beginTransaction();
        try {
            $claim = Claim::create([
                'tenant_id' => auth()->user()->tenant_id,
                'policy_id' => $validated['policy_id'],
                'customer_id' => $validated['customer_id'],
                'claim_reference' => Claim::generateClaimReference(auth()->user()->tenant_id),
                'claim_type' => $validated['claim_type'],
                'incident_date' => $validated['incident_date'],
                'incident_description' => $validated['incident_description'],
                'incident_location' => $validated['incident_location'] ?? null,
                'claim_amount' => $validated['claim_amount'],
                'status' => Claim::STATUS_DRAFT,
            ]);

            $claim->logActivity(auth()->user(), 'created', 'Claim created');

            // Handle file uploads if any
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $index => $file) {
                    $path = $file->store('claims/'.$claim->id.'/documents', 'public');

                    $claim->documents()->create([
                        'uploaded_by' => auth()->id(),
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientOriginalExtension(),
                        'file_size' => $file->getSize(),
                        'document_type' => $request->input("document_types.{$index}", 'other'),
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('claims.show', $claim)
                ->with('success', 'Claim created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to create claim: '.$e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Claim $claim)
    {
        $this->authorize('view', $claim);

        $claim->load([
            'customer',
            'policy.policyProduct',
            'submittedBy',
            'reviewer',
            'documents.uploadedBy',
            'comments.author',
            'comments.replies.author',
            'activities.user',
        ]);

        // Get only top-level comments (not replies)
        $comments = $claim->comments()
            ->whereNull('parent_id')
            ->with(['author', 'replies.author'])
            ->latest()
            ->get();

        return Inertia::render('Claims/Show', [
            'claim' => $claim,
            'comments' => $comments,
            'canEdit' => auth()->user()->can('update', $claim),
            'canSubmit' => auth()->user()->can('submit', $claim),
            'canReview' => auth()->user()->can('review', $claim),
            'canApprove' => auth()->user()->can('approve', $claim),
            'canReject' => auth()->user()->can('reject', $claim),
            'canSettle' => auth()->user()->can('settle', $claim),
            'canClose' => auth()->user()->can('close', $claim),
            'canAddDocuments' => auth()->user()->can('addDocuments', $claim),
            'canAddComments' => auth()->user()->can('addComments', $claim),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Claim $claim)
    {
        $this->authorize('update', $claim);

        $claim->load(['customer', 'policy', 'documents']);

        $policies = Policy::where('tenant_id', auth()->user()->tenant_id)
            ->where('status', Policy::STATUS_ACTIVE)
            ->with(['customer', 'policyProduct'])
            ->get();

        $customers = Customer::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Claims/Edit', [
            'claim' => $claim,
            'policies' => $policies,
            'customers' => $customers,
            'claimTypes' => $this->getClaimTypes(),
            'documentTypes' => $this->getDocumentTypes(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Claim $claim)
    {
        try {
            $this->authorize('update', $claim);

            $validated = $request->validate([
                'policy_id' => 'required|exists:policies,id',
                'customer_id' => 'required|exists:customers,id',
                'claim_type' => 'required|in:accident,theft,damage,fire,flood,medical,death,disability,liability,other',
                'incident_date' => 'required|date|before_or_equal:today',
                'incident_description' => 'required|string|min:10',
                'incident_location' => 'nullable|string|max:255',
                'claim_amount' => 'required|numeric|min:0',
            ]);

            $claim->update($validated);

            $claim->logActivity(auth()->user(), 'updated', 'Claim details updated');

            return redirect()->route('claims.show', $claim)
                ->with('success', 'Claim updated successfully.');
        } catch (\Throwable $th) {
            Log::error('Failed to update claim'.$th->getMessage());

            return back()->withErrors(['error' => 'Failed to update claim: '.$th->getMessage()]);
        }

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Claim $claim)
    {
        $this->authorize('delete', $claim);

        $claim->logActivity(auth()->user(), 'deleted', 'Claim deleted');
        $claim->delete();

        return redirect()->route('claims.index')
            ->with('success', 'Claim deleted successfully.');
    }

    /**
     * Submit claim for review.
     */
    public function submit(Claim $claim)
    {
        $this->authorize('submit', $claim);

        try {
            $claim->submit(auth()->user());

            // TODO: Send notification to reviewers

            return back()->with('success', 'Claim submitted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Start reviewing a claim.
     */
    public function startReview(Claim $claim)
    {
        $this->authorize('review', $claim);

        try {
            $claim->startReview(auth()->user());

            return back()->with('success', 'Claim review started.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Approve a claim.
     */
    public function approve(Request $request, Claim $claim)
    {
        $this->authorize('approve', $claim);

        $validated = $request->validate([
            'approved_amount' => ['required', 'numeric', 'min:0', function ($attribute, $value, $fail) use ($claim) {
                if ((float) $value > (float) $claim->claim_amount) {
                    $fail('The approved amount may not exceed the original claim amount.');
                }
            }],
            'decision_notes' => 'nullable|string',
        ]);

        try {
            $oldStatus = $claim->status;

            $claim->approve(
                auth()->user(),
                $validated['approved_amount'],
                $validated['decision_notes'] ?? null
            );

            // Send notification to customer
            $claim->customer->notify(new ClaimApproved($claim, $validated['approved_amount']));

            // Send notification to broker/underwriter (only if policy has a separate customer)
            if ($claim->policy && $claim->policy->customer && $claim->policy->customer->id !== $claim->customer_id) {
                $claim->policy->customer->notify(new ClaimStatusUpdated($claim, $oldStatus, $claim->status));
            }

            // Dispatch broadcast event
            event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, auth()->user()));

            return back()->with('success', 'Claim approved successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reject a claim.
     */
    public function reject(Request $request, Claim $claim)
    {
        $this->authorize('reject', $claim);

        $validated = $request->validate([
            'decision_notes' => 'required|string|min:10',
        ]);

        try {
            $oldStatus = $claim->status;

            $claim->reject(auth()->user(), $validated['decision_notes']);

            // Send notification to customer
            $claim->customer->notify(new ClaimRejected($claim, $validated['decision_notes']));

            // Send notification to broker/underwriter (only if policy has a separate customer)
            if ($claim->policy && $claim->policy->customer && $claim->policy->customer->id !== $claim->customer_id) {
                $claim->policy->customer->notify(new ClaimStatusUpdated($claim, $oldStatus, $claim->status));
            }

            // Dispatch broadcast event
            event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, auth()->user()));

            return back()->with('success', 'Claim rejected.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Request additional information.
     */
    public function requestInfo(Request $request, Claim $claim)
    {
        $this->authorize('requestInfo', $claim);

        $validated = $request->validate([
            'message' => 'required|string|min:10',
        ]);

        try {
            $claim->requestAdditionalInfo(auth()->user(), $validated['message']);

            // Send notification to customer
            $claim->customer->notify(new AdditionalInfoRequested($claim, $validated['message']));

            return back()->with('success', 'Additional information requested.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Settle a claim.
     */
    public function settle(Request $request, Claim $claim)
    {
        $this->authorize('settle', $claim);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            $claim->settle(auth()->user(), $validated['notes'] ?? null);

            // TODO: Send notification to claimant

            return back()->with('success', 'Claim marked as settled.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Close a claim.
     */
    public function close(Request $request, Claim $claim)
    {
        $this->authorize('close', $claim);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            $claim->close(auth()->user(), $validated['notes'] ?? null);

            return back()->with('success', 'Claim closed.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Upload documents to a claim.
     */
    public function uploadDocuments(Request $request, Claim $claim)
    {
        $this->authorize('addDocuments', $claim);

        $validated = $request->validate([
            'documents' => 'required|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'document_types' => 'nullable|array',
            'descriptions' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->file('documents') as $index => $file) {
                $path = $file->store('claims/'.$claim->id.'/documents', 'public');

                $claim->documents()->create([
                    'uploaded_by' => auth()->id(),
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientOriginalExtension(),
                    'file_size' => $file->getSize(),
                    'document_type' => $request->input("document_types.{$index}", 'other'),
                    'description' => $request->input("descriptions.{$index}"),
                ]);
            }

            $claim->logActivity(auth()->user(), 'documents_uploaded', 'Documents uploaded');

            DB::commit();

            return back()->with('success', 'Documents uploaded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to upload documents: '.$e->getMessage()]);
        }
    }

    /**
     * Add a comment to a claim.
     */
    public function addComment(Request $request, Claim $claim)
    {
        $this->authorize('addComments', $claim);

        $validated = $request->validate([
            'body' => 'required|string|min:1',
            'is_internal' => 'boolean',
            'parent_id' => 'nullable|exists:claim_comments,id',
        ]);

        try {
            $comment = $claim->comments()->create([
                'author_id' => auth()->id(),
                'body' => $validated['body'],
                'is_internal' => $validated['is_internal'] ?? false,
                'parent_id' => $validated['parent_id'] ?? null,
            ]);

            $claim->logActivity(auth()->user(), 'comment_added', 'Comment added to claim');

            // TODO: Send notification to relevant parties

            return back()->with('success', 'Comment added successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to add comment: '.$e->getMessage()]);
        }
    }

    /**
     * Get claim types for dropdown.
     */
    private function getClaimTypes(): array
    {
        return [
            ['value' => 'accident', 'label' => 'Accident'],
            ['value' => 'theft', 'label' => 'Theft'],
            ['value' => 'damage', 'label' => 'Damage'],
            ['value' => 'fire', 'label' => 'Fire'],
            ['value' => 'flood', 'label' => 'Flood'],
            ['value' => 'medical', 'label' => 'Medical'],
            ['value' => 'death', 'label' => 'Death'],
            ['value' => 'disability', 'label' => 'Disability'],
            ['value' => 'liability', 'label' => 'Liability'],
            ['value' => 'other', 'label' => 'Other'],
        ];
    }

    /**
     * Get document types for dropdown.
     */
    private function getDocumentTypes(): array
    {
        return [
            ['value' => 'incident_photo', 'label' => 'Incident Photo'],
            ['value' => 'police_report', 'label' => 'Police Report'],
            ['value' => 'medical_report', 'label' => 'Medical Report'],
            ['value' => 'repair_estimate', 'label' => 'Repair Estimate'],
            ['value' => 'invoice', 'label' => 'Invoice'],
            ['value' => 'receipt', 'label' => 'Receipt'],
            ['value' => 'witness_statement', 'label' => 'Witness Statement'],
            ['value' => 'correspondence', 'label' => 'Correspondence'],
            ['value' => 'other', 'label' => 'Other'],
        ];
    }
}
