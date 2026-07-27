<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDebitNoteRequest;
use App\Http\Requests\Api\V1\UpdateDebitNoteRequest;
use App\Http\Resources\Api\V1\DebitNoteCollection;
use App\Http\Resources\Api\V1\DebitNoteResource;
use App\Http\Responses\ApiResponse;
use App\Models\DebitNote;
use App\Services\DebitNoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DebitNoteController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DebitNoteService $debitNoteService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = DebitNote::where('tenant_id', $tenantId)
            ->with(['customer', 'policy', 'createdBy']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('note_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
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

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($policyId = $request->policy_id) {
            $query->where('policy_id', $policyId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'note_number', 'amount', 'total_amount', 'status', 'issue_date', 'due_date', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $notes = $query->paginate($perPage);

        return DebitNoteCollection::make($notes)->response();
    }

    public function store(StoreDebitNoteRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            $note = $this->debitNoteService->create(
                $request->validated(),
                $user->tenant_id,
                $user->id
            );

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respondCreated(
                new DebitNoteResource($note),
                'Debit note created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to create debit note: '.$e->getMessage(), 422);
        }
    }

    public function show(Request $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $debitNote->load(['customer', 'policy', 'createdBy', 'tenant']);

        return $this->respond(new DebitNoteResource($debitNote));
    }

    public function update(UpdateDebitNoteRequest $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($debitNote->status !== DebitNote::STATUS_DRAFT) {
            return $this->respondError('Only draft debit notes can be edited.', 422);
        }

        try {
            $note = $this->debitNoteService->update($debitNote, $request->validated());

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respond(
                new DebitNoteResource($note),
                'Debit note updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to update debit note: '.$e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($debitNote->status !== DebitNote::STATUS_DRAFT) {
            return $this->respondError('Only draft debit notes can be deleted.', 422);
        }

        $this->debitNoteService->delete($debitNote);

        return $this->respondNoContent('Debit note deleted successfully.');
    }

    // ─── Workflow ───

    public function issue(Request $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! in_array($debitNote->status, [DebitNote::STATUS_DRAFT, DebitNote::STATUS_GENERATED])) {
            return $this->respondError('Only draft or generated debit notes can be issued.', 422);
        }

        try {
            $note = $this->debitNoteService->issue($debitNote);

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respond(
                new DebitNoteResource($note),
                'Debit note issued successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to issue debit note: '.$e->getMessage(), 422);
        }
    }

    public function markAsPaid(Request $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($debitNote->status !== DebitNote::STATUS_ISSUED) {
            return $this->respondError('Only issued debit notes can be marked as paid.', 422);
        }

        try {
            $note = $this->debitNoteService->markAsPaid($debitNote, $request->user());

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respond(
                new DebitNoteResource($note),
                'Debit note marked as paid.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to mark debit note as paid: '.$e->getMessage(), 422);
        }
    }

    public function cancel(Request $request, DebitNote $debitNote): JsonResponse
    {
        if ($debitNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (in_array($debitNote->status, [DebitNote::STATUS_CANCELLED, DebitNote::STATUS_PAID, 'void'])) {
            return $this->respondError('Debit note cannot be cancelled in its current status.', 422);
        }

        try {
            $reason = $request->input('reason');
            $note = $this->debitNoteService->cancel($debitNote, $reason, $request->user()->id);

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respond(
                new DebitNoteResource($note),
                'Debit note cancelled successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to cancel debit note: '.$e->getMessage(), 422);
        }
    }
}
