<?php

namespace App\Services;

use App\Models\DebitNote;
use App\Models\Policy;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DebitNoteService
{
    public function createDebitNoteFromPolicy(Policy $policy, array $data): DebitNote
    {
        $tenantId = $policy->tenant_id;
        $year = now()->year;
        // Generate Credit Note Number
        $lastCreditNote = DebitNote::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
        $lastNumber = $lastCreditNote ? intval(substr($lastCreditNote->note_number, -6)) : 0;
        $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        $referenceNumber = sprintf('DN-%d-%d-%06d', $year, $tenantId, $newNumber);

        $debitNote = DebitNote::create([
            'note_number' => $newNumber,
            'reference_number' => $referenceNumber,
            'tenant_id' => $tenantId,
            'customer_id' => $policy->customer_id,
            'policy_id' => $policy->id,
            'broker_id' => Auth::user()->isBroker() ? Auth::id() : null,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'total_amount' => $data['amount'] + ($data['tax_amount'] ?? 0),
            'description' => $data['description'] ?? 'Debit Note for Policy #'.$policy->policy_number,
            'issue_date' => now()->format('Y-m-d'),
            'due_date' => $data['due_date'] ?? now()->addDays(30)->format('Y-m-d'),
            'created_by_id' => Auth::id(),
            'items' => $data['items'] ?? null,
            'premium_breakdown' => $policy->coverage_details,
            'currency_code' => 'NGN',
        ]);

        return $debitNote;
    }

    /**
     * Build and return a filtered query for debit notes.
     */
    public function buildQuery(Request $request)
    {
        $query = DebitNote::query()
            ->with(['customer', 'policy', 'createdBy'])
            ->latest();

        return $query;
    }

    /**
     * Build and return a filtered query for debit notes.
     */
    public function listNotes(Request $request, int $perPage = 10)
    {
        $query = $this->buildQuery($request);
        $notes = $query->paginate($perPage);

        $customers = \App\Models\Customer::select('id', 'first_name', 'last_name', 'company_name', 'type')->get();

        $stats = [
            'total_debit' => DebitNote::sum('amount'),
            'outstanding_debit' => DebitNote::where('status', 'issued')->sum('amount'),
            'overdue_count' => DebitNote::where('status', 'issued')
                ->where('due_date', '<', now())
                ->count(),
        ];

        return compact('notes', 'customers', 'stats');
    }

    public function getPoliciesByCustomer(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
        ]);

        $policies = Policy::where('customer_id', $request->customer_id)
            ->with('policyProduct:id,name')
            ->select('id', 'policy_number', 'policy_product_id', 'premium_amount')
            ->get();

        return $policies;
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:issue,cancel,delete',
            'note_ids' => 'required|array|min:1',
            'note_ids.*' => 'exists:debit_notes,id',
        ]);

        $notes = DebitNote::whereIn('id', $request->note_ids)->get();
        $processed = 0;

        foreach ($notes as $note) {
            try {
                match ($request->action) {
                    'issue' => $note->status === 'draft' ? $note->update(['status' => 'issued']) && $processed++ : null,
                    'cancel' => $note->status !== 'paid' ? $note->update(['status' => 'cancelled']) && $processed++ : null,
                    'delete' => $note->status === 'draft' ? $note->delete() && $processed++ : null,
                };
            } catch (\Exception $e) {
                continue;
            }
        }

        return $processed;
    }

    public function generatePdf(DebitNote $debitNote)
    {
        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $pdf = Pdf::loadView('debit-notes.pdf', compact('debitNote'));

        return $pdf;
    }
}
