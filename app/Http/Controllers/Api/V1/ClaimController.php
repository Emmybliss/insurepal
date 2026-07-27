<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddClaimCommentRequest;
use App\Http\Requests\Api\V1\StoreClaimRequest;
use App\Http\Requests\Api\V1\UpdateClaimRequest;
use App\Http\Requests\Api\V1\UploadClaimDocumentsRequest;
use App\Http\Requests\Shared\ApproveClaimRequest;
use App\Http\Requests\Shared\RequestClaimInfoRequest;
use App\Http\Resources\Api\V1\ClaimCollection;
use App\Http\Resources\Api\V1\ClaimResource;
use App\Http\Responses\ApiResponse;
use App\Models\Claim;
use App\Services\Claims\ApproveClaimService;
use App\Services\Claims\RegisterClaimService;
use App\Services\Claims\SettleClaimService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    use ApiResponse;

    public function __construct(
        private RegisterClaimService $registerClaimService,
        private ApproveClaimService $approveClaimService,
        private SettleClaimService $settleClaimService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Claim::forTenant($tenantId)
            ->with(['customer', 'policy', 'submittedBy', 'reviewer']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('claim_reference', 'like', "%{$search}%")
                    ->orWhere('incident_description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($claimType = $request->claim_type) {
            $query->where('claim_type', $claimType);
        }

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($policyId = $request->policy_id) {
            $query->where('policy_id', $policyId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('incident_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('incident_date', '<=', $dateTo);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'claim_reference', 'claim_type', 'status', 'claim_amount',
                'incident_date', 'created_at', 'submitted_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $claims = $query->paginate($perPage);

        return ClaimCollection::make($claims)->response();
    }

    public function store(StoreClaimRequest $request): JsonResponse
    {
        try {
            $claim = $this->registerClaimService->register(
                $request->validated(),
                $request->user()
            );

            $claim->load(['customer', 'policy', 'submittedBy', 'reviewer']);

            return $this->respondCreated(
                new ClaimResource($claim),
                'Claim created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function show(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $claim->load([
            'customer',
            'policy',
            'submittedBy',
            'reviewer',
            'documents.uploadedBy',
            'comments.author',
            'comments.replies.author',
            'activities.user',
        ]);

        return $this->respond(new ClaimResource($claim));
    }

    public function update(UpdateClaimRequest $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $claim->canEdit()) {
            return $this->respondError('Claim cannot be edited in current status.', 422);
        }

        $claim->update($request->validated());

        $claim->load(['customer', 'policy', 'submittedBy', 'reviewer']);

        return $this->respond(
            new ClaimResource($claim),
            'Claim updated successfully.'
        );
    }

    public function destroy(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $claim->isDraft()) {
            return $this->respondError('Only draft claims can be deleted.', 422);
        }

        $claim->logActivity($request->user(), 'deleted', 'Claim deleted');
        $claim->delete();

        return $this->respondNoContent('Claim deleted successfully.');
    }

    public function submit(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->approveClaimService->submit($claim, $request->user());

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim submitted successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function startReview(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->approveClaimService->startReview($claim, $request->user());

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim review started.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function approve(ApproveClaimRequest $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->approveClaimService->approve(
                $claim,
                $request->user(),
                $request->approved_amount,
                $request->decision_notes
            );

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim approved successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function reject(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate([
            'decision_notes' => 'required|string|min:10',
        ]); // single field — leave inline

        try {
            $this->approveClaimService->reject($claim, $request->user(), $request->decision_notes);

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim rejected.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function requestInfo(RequestClaimInfoRequest $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->approveClaimService->requestAdditionalInfo($claim, $request->user(), $request->message);

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Additional information requested.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function settle(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate([
            'notes' => 'nullable|string',
        ]); // single field — leave inline

        try {
            $this->settleClaimService->settle($claim, $request->user(), $request->notes);

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim settled successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function close(Request $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate([
            'notes' => 'nullable|string',
        ]); // single field — leave inline

        try {
            $this->settleClaimService->close($claim, $request->user(), $request->notes);

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['customer', 'policy', 'submittedBy', 'reviewer'])),
                'Claim closed successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function uploadDocuments(UploadClaimDocumentsRequest $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $claim->canAddDocuments()) {
            return $this->respondError('Cannot add documents to a closed claim.', 422);
        }

        $request->validated();

        try {
            $files = [];
            $documentTypes = [];
            $descriptions = [];

            foreach ($request->file('documents', []) as $index => $file) {
                $files[$index] = $file;
                $documentTypes[$index] = $request->input("documents.{$index}.document_type", 'other');
                $descriptions[$index] = $request->input("documents.{$index}.description");
            }

            $this->registerClaimService->uploadDocuments(
                $claim,
                $files,
                $request->user(),
                $documentTypes,
                $descriptions
            );

            return $this->respond(
                new ClaimResource($claim->fresh()->load(['documents.uploadedBy'])),
                'Documents uploaded successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to upload documents: '.$e->getMessage(), 422);
        }
    }

    public function addComment(AddClaimCommentRequest $request, Claim $claim): JsonResponse
    {
        if ($claim->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $comment = $claim->comments()->create([
                'author_id' => $request->user()->id,
                'body' => $request->body,
                'is_internal' => $request->boolean('is_internal', false),
                'parent_id' => $request->parent_id,
            ]);

            $claim->logActivity($request->user(), 'comment_added', 'Comment added to claim');

            return $this->respondCreated(
                [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'is_internal' => $comment->is_internal,
                    'parent_id' => $comment->parent_id,
                    'author' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                    ],
                    'created_at' => $comment->created_at->toISOString(),
                ],
                'Comment added successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to add comment: '.$e->getMessage(), 422);
        }
    }
}
