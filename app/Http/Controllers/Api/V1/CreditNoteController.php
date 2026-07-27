<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCreditNoteRequest;
use App\Http\Requests\Api\V1\UpdateCreditNoteRequest;
use App\Http\Resources\Api\V1\CreditNoteCollection;
use App\Http\Resources\Api\V1\CreditNoteResource;
use App\Http\Responses\ApiResponse;
use App\Models\CreditNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditNoteController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = CreditNote::where('tenant_id', $tenantId)
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

        return CreditNoteCollection::make($notes)->response();
    }

    public function store(StoreCreditNoteRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            DB::beginTransaction();

            $tenantId = $user->tenant_id;

            $lastNote = CreditNote::withTrashed()
                ->where('tenant_id', $tenantId)
                ->latest('id')
                ->first();
            $lastNumber = $lastNote ? (int) substr($lastNote->note_number, -6) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

            $year = now()->year;
            $referenceNumber = sprintf('CN-%d-%d-%06d', $year, $tenantId, $newNumber);

            $lastSequence = CreditNote::withTrashed()
                ->where('tenant_id', $tenantId)
                ->latest('id')
                ->first();
            $sequenceNumber = $lastSequence ? $lastSequence->sequence_number + 1 : 1;

            $note = CreditNote::create([
                'note_number' => $newNumber,
                'sequence_number' => $sequenceNumber,
                'reference_number' => $referenceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $request->validated('customer_id'),
                'policy_id' => $request->validated('policy_id'),
                'description' => $request->validated('description'),
                'amount' => $request->validated('amount'),
                'tax_amount' => $request->validated('tax_amount', 0),
                'total_amount' => $request->validated('total_amount'),
                'due_date' => $request->validated('due_date'),
                'currency_code' => $request->validated('currency_code', 'NGN'),
                'exchange_rate' => $request->validated('exchange_rate', 1),
                'type' => $request->validated('type', 'standard'),
                'items' => $request->validated('items'),
                'metadata' => $request->validated('metadata'),
                'debit_note_id' => $request->validated('debit_note_id'),
                'status' => CreditNote::STATUS_DRAFT,
                'created_by_id' => $user->id,
            ]);

            DB::commit();

            $note->load(['customer', 'policy', 'createdBy']);

            return $this->respondCreated(
                new CreditNoteResource($note),
                'Credit note created successfully.'
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->respondError('Failed to create credit note: '.$e->getMessage(), 422);
        }
    }

    public function show(Request $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $creditNote->load(['customer', 'policy', 'createdBy', 'tenant']);

        return $this->respond(new CreditNoteResource($creditNote));
    }

    public function update(UpdateCreditNoteRequest $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($creditNote->status !== CreditNote::STATUS_DRAFT) {
            return $this->respondError('Only draft credit notes can be edited.', 422);
        }

        try {
            DB::beginTransaction();

            $creditNote->update($request->validated());

            DB::commit();

            $creditNote->load(['customer', 'policy', 'createdBy']);

            return $this->respond(
                new CreditNoteResource($creditNote),
                'Credit note updated successfully.'
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->respondError('Failed to update credit note: '.$e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($creditNote->status !== CreditNote::STATUS_DRAFT) {
            return $this->respondError('Only draft credit notes can be deleted.', 422);
        }

        $creditNote->delete();

        return $this->respondNoContent('Credit note deleted successfully.');
    }

    // ─── Workflow ───

    public function issue(Request $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! in_array($creditNote->status, [CreditNote::STATUS_DRAFT, CreditNote::STATUS_GENERATED])) {
            return $this->respondError('Only draft or generated credit notes can be issued.', 422);
        }

        $creditNote->update([
            'status' => CreditNote::STATUS_ISSUED,
            'issue_date' => now(),
        ]);

        $creditNote->load(['customer', 'policy', 'createdBy']);

        return $this->respond(
            new CreditNoteResource($creditNote),
            'Credit note issued successfully.'
        );
    }

    public function markAsPaid(Request $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($creditNote->status !== CreditNote::STATUS_ISSUED) {
            return $this->respondError('Only issued credit notes can be marked as paid.', 422);
        }

        $creditNote->update([
            'status' => CreditNote::STATUS_PAID,
            'paid_at' => now(),
        ]);

        $creditNote->load(['customer', 'policy', 'createdBy']);

        return $this->respond(
            new CreditNoteResource($creditNote),
            'Credit note marked as paid.'
        );
    }

    public function cancel(Request $request, CreditNote $creditNote): JsonResponse
    {
        if ($creditNote->tenant_id != $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (in_array($creditNote->status, [CreditNote::STATUS_CANCELLED, CreditNote::STATUS_PAID, 'void'])) {
            return $this->respondError('Credit note cannot be cancelled in its current status.', 422);
        }

        $reason = $request->input('reason');
        $creditNote->update([
            'status' => CreditNote::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancelled_by_id' => $request->user()->id,
            'cancellation_reason' => $reason,
        ]);

        $creditNote->load(['customer', 'policy', 'createdBy']);

        return $this->respond(
            new CreditNoteResource($creditNote),
            'Credit note cancelled successfully.'
        );
    }
}
