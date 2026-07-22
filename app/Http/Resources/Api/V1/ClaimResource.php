<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Claim;
use Illuminate\Http\Request;

class ClaimResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var Claim $this */
        return [
            'id' => $this->id,
            'claim_reference' => $this->claim_reference,
            'claim_type' => $this->claim_type,
            'claim_type_label' => $this->getTypeLabel(),
            'status' => $this->status,
            'status_label' => $this->status_label,
            'status_color' => $this->status_color,
            'incident_date' => $this->incident_date?->toDateString(),
            'incident_description' => $this->incident_description,
            'incident_location' => $this->incident_location,
            'claim_amount' => $this->claim_amount,
            'approved_amount' => $this->approved_amount,
            'decision_notes' => $this->decision_notes,
            'internal_notes' => $this->internal_notes,
            'metadata' => $this->metadata,
            'days_open' => $this->days_open,
            'is_draft' => $this->isDraft(),
            'is_submitted' => $this->isSubmitted(),
            'is_pending' => $this->isPending(),
            'can_edit' => $this->canEdit(),
            'can_submit' => $this->canSubmit(),
            'can_review' => $this->canReview(),
            'can_approve' => $this->canApprove(),
            'can_reject' => $this->canReject(),
            'can_request_info' => $this->canRequestInfo(),
            'can_settle' => $this->canSettle(),
            'can_close' => $this->canClose(),
            'can_add_documents' => $this->canAddDocuments(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'approved_at' => $this->approved_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'settled_at' => $this->settled_at?->toISOString(),
            'closed_at' => $this->closed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'policy' => $this->whenLoaded('policy', function () {
                return [
                    'id' => $this->policy->id,
                    'policy_number' => $this->policy->policy_number,
                ];
            }),
            'submitted_by' => $this->whenLoaded('submittedBy', function () {
                return [
                    'id' => $this->submittedBy->id,
                    'name' => $this->submittedBy->name,
                ];
            }),
            'reviewer' => $this->whenLoaded('reviewer', function () {
                return [
                    'id' => $this->reviewer->id,
                    'name' => $this->reviewer->name,
                ];
            }),
            'documents' => $this->whenRelationLoaded('documents', ClaimDocumentResource::collection($this->documents)),
            'comments' => $this->whenRelationLoaded('comments', function () {
                return $this->comments->whereNull('parent_id')->values()->map(fn ($c) => [
                    'id' => $c->id,
                    'body' => $c->body,
                    'is_internal' => $c->is_internal,
                    'author' => $c->author ? ['id' => $c->author->id, 'name' => $c->author->name] : null,
                    'created_at' => $c->created_at->toISOString(),
                    'replies' => $c->replies->map(fn ($r) => [
                        'id' => $r->id,
                        'body' => $r->body,
                        'is_internal' => $r->is_internal,
                        'author' => $r->author ? ['id' => $r->author->id, 'name' => $r->author->name] : null,
                        'created_at' => $r->created_at->toISOString(),
                    ]),
                ]);
            }),
            'activities' => $this->whenRelationLoaded('activities', function () {
                return $this->activities->map(fn ($a) => [
                    'id' => $a->id,
                    'action' => $a->action,
                    'description' => $a->description,
                    'user' => $a->user ? $a->user->name : null,
                    'created_at' => $a->created_at->toISOString(),
                ]);
            }),
        ];
    }
}
