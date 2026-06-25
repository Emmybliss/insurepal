<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\Policy;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CreditNoteService
{
    public function createCreditNoteFromPolicy(Policy $policy, array $data): CreditNote
    {
        $tenantId = $policy->tenant_id;
        $year = now()->year;
        // Generate Credit Note Number
        $lastCreditNote = CreditNote::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
        $lastNumber = $lastCreditNote ? intval(substr($lastCreditNote->note_number, -6)) : 0;
        $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        $referenceNumber = sprintf('CN-%d-%d-%06d', $year, $tenantId, $newNumber);

        $creditNote = CreditNote::create([
            'note_number' => $newNumber,
            'reference_number' => $referenceNumber,
            'tenant_id' => $tenantId,
            'customer_id' => $policy->customer_id,
            'policy_id' => $policy->id,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'total_amount' => $data['amount'] + ($data['tax_amount'] ?? 0),
            'description' => $data['description'] ?? 'Credit Note for Policy #'.$policy->policy_number,
            'issue_date' => now()->format('Y-m-d'),
            'created_by_id' => Auth::id(),
            'items' => $data['items'] ?? null,
            'currency_code' => 'NGN',
        ]);

        return $creditNote;
    }

    /**
     * Build and return a filtered query for credit notes.
     */
    public function buildQuery(Request $request)
    {
        $query = CreditNote::query()
            ->with(['customer', 'policy', 'createdBy'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('note_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query;
    }

    public function listNotes(Request $request, int $perPage = 10)
    {
        $query = $this->buildQuery($request);
        $notes = $query->paginate($perPage);

        $customers = \App\Models\Customer::select('id', 'first_name', 'last_name', 'company_name', 'type')->get();

        $stats = [
            'total_credit' => CreditNote::sum('amount'), // Changed to total_credit
            'outstanding_credit' => CreditNote::where('status', 'issued')->sum('amount'), // Changed to outstanding_credit
            'overdue_count' => CreditNote::where('status', 'issued') // Though credit notes usually aren't "overdue" in the same way, we'll keep the structure or maybe this isn't relevant for credit notes?
                // Debit notes have due dates. Credit notes might not have a "due date" in the same sense, but let's check the controller/migration usage.
                // Looking at CreditNoteController store method line 106, it has 'due_date'.
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
            'note_ids.*' => 'exists:credit_notes,id',
        ]);

        $notes = CreditNote::whereIn('id', $request->note_ids)->get();
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

    public function generatePdf(CreditNote $creditNote)
    {
        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $pdf = Pdf::loadView('credit-notes.pdf', compact('creditNote'));

        return $pdf;
    }
}
