<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shared\AddClaimCommentRequest;
use App\Http\Requests\Shared\ApproveClaimRequest;
use App\Http\Requests\Shared\RejectClaimRequest;
use App\Http\Requests\Shared\RequestClaimInfoRequest;
use App\Http\Requests\Shared\StoreClaimRequest;
use App\Http\Requests\Shared\UpdateClaimRequest;
use App\Http\Requests\Shared\UploadClaimDocumentsRequest;
use App\Models\Claim;
use App\Services\Claims\ApproveClaimService;
use App\Services\Claims\ClaimCommentService;
use App\Services\Claims\ClaimListingService;
use App\Services\Claims\RegisterClaimService;
use App\Services\Claims\SettleClaimService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ClaimController extends Controller
{
    public function __construct(
        private RegisterClaimService $registerClaimService,
        private ApproveClaimService $approveClaimService,
        private SettleClaimService $settleClaimService,
        private ClaimListingService $claimListingService,
        private ClaimCommentService $claimCommentService,
    ) {
        $this->middleware('auth');
    }

    public function index()
    {
        $this->authorize('viewAny', Claim::class);

        $user = request()->user();
        $filters = request()->only(['status', 'claim_type', 'search', 'date_from', 'date_to', 'sort_by', 'sort_order']);

        return Inertia::render('Claims/Index', [
            'claims' => $this->claimListingService->list($user, $filters),
            'stats' => $this->claimListingService->getStats($user),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Claim::class);

        $user = request()->user();

        return Inertia::render('Claims/Create', [
            ...$this->claimListingService->getCreateData($user),
            'claimTypes' => $this->claimListingService->getClaimTypes(),
            'documentTypes' => $this->claimListingService->getDocumentTypes(),
        ]);
    }

    public function store(StoreClaimRequest $request)
    {
        $this->authorize('create', Claim::class);

        try {
            $claim = $this->registerClaimService->register(
                $request->validated(),
                $request->user()
            );

            if ($request->hasFile('documents')) {
                $this->registerClaimService->uploadDocuments(
                    $claim,
                    $request->file('documents'),
                    $request->user(),
                    $request->input('document_types', []),
                );
            }

            return redirect()->route('claims.show', $claim)
                ->with('success', 'Claim created successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to create claim: '.$e->getMessage());

            return back()->withErrors(['error' => 'Failed to create claim: '.$e->getMessage()]);
        }
    }

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

        $comments = $claim->comments()
            ->whereNull('parent_id')
            ->with(['author', 'replies.author'])
            ->latest()
            ->get();

        $user = request()->user();

        return Inertia::render('Claims/Show', [
            'claim' => $claim,
            'comments' => $comments,
            ...$this->claimListingService->getShowPermissions($user, $claim),
        ]);
    }

    public function edit(Claim $claim)
    {
        $this->authorize('update', $claim);

        $claim->load(['customer', 'policy', 'documents']);

        $user = request()->user();

        return Inertia::render('Claims/Edit', [
            'claim' => $claim,
            ...$this->claimListingService->getEditData($user),
            'claimTypes' => $this->claimListingService->getClaimTypes(),
            'documentTypes' => $this->claimListingService->getDocumentTypes(),
        ]);
    }

    public function update(UpdateClaimRequest $request, Claim $claim)
    {
        $this->authorize('update', $claim);

        try {
            $this->registerClaimService->updateClaim($claim, $request->validated(), $request->user());

            return redirect()->route('claims.show', $claim)
                ->with('success', 'Claim updated successfully.');
        } catch (\Throwable $th) {
            Log::error('Failed to update claim '.$th->getMessage());

            return back()->withErrors(['error' => 'Failed to update claim: '.$th->getMessage()]);
        }
    }

    public function destroy(Claim $claim)
    {
        $this->authorize('delete', $claim);

        $claim->logActivity(request()->user(), 'deleted', 'Claim deleted');
        $claim->delete();

        return redirect()->route('claims.index')
            ->with('success', 'Claim deleted successfully.');
    }

    public function submit(Claim $claim)
    {
        $this->authorize('submit', $claim);

        try {
            $this->approveClaimService->submit($claim, request()->user());

            return back()->with('success', 'Claim submitted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function startReview(Claim $claim)
    {
        $this->authorize('review', $claim);

        try {
            $this->approveClaimService->startReview($claim, request()->user());

            return back()->with('success', 'Claim review started.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function approve(ApproveClaimRequest $request, Claim $claim)
    {
        $this->authorize('approve', $claim);

        $validated = $request->validated();

        try {
            $this->approveClaimService->approve(
                $claim,
                $request->user(),
                $validated['approved_amount'],
                $validated['decision_notes'] ?? null
            );

            return back()->with('success', 'Claim approved successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function reject(RejectClaimRequest $request, Claim $claim)
    {
        $this->authorize('reject', $claim);

        try {
            $this->approveClaimService->reject($claim, $request->user(), $request->validated()['decision_notes']);

            return back()->with('success', 'Claim rejected.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function requestInfo(RequestClaimInfoRequest $request, Claim $claim)
    {
        $this->authorize('requestInfo', $claim);

        try {
            $this->approveClaimService->requestAdditionalInfo($claim, $request->user(), $request->validated()['message']);

            return back()->with('success', 'Additional information requested.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function settle(Claim $claim)
    {
        $this->authorize('settle', $claim);

        try {
            $this->settleClaimService->settle($claim, request()->user(), request('notes'));

            return back()->with('success', 'Claim marked as settled.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function close(Claim $claim)
    {
        $this->authorize('close', $claim);

        try {
            $this->settleClaimService->close($claim, request()->user(), request('notes'));

            return back()->with('success', 'Claim closed.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function uploadDocuments(UploadClaimDocumentsRequest $request, Claim $claim)
    {
        $this->authorize('addDocuments', $claim);

        try {
            $this->registerClaimService->uploadDocuments(
                $claim,
                $request->file('documents'),
                $request->user(),
                $request->input('document_types', []),
                $request->input('descriptions', [])
            );

            return back()->with('success', 'Documents uploaded successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to upload documents: '.$e->getMessage()]);
        }
    }

    public function addComment(AddClaimCommentRequest $request, Claim $claim)
    {
        $this->authorize('addComments', $claim);

        try {
            $this->claimCommentService->addComment($claim, $request->user(), $request->validated());

            return back()->with('success', 'Comment added successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to add comment: '.$e->getMessage()]);
        }
    }
}
