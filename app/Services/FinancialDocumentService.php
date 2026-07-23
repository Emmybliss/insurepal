<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FinancialDocumentService
{
    public function createDebitNoteFromPolicy(Policy $policy, User $user, array $data): DebitNote
    {
        $tenantId = $policy->tenant_id;
        $sequenceNumber = $this->getNextSequenceNumber('debit', $tenantId);
        $year = now()->year;

        $noteNumber = sprintf('DN-%d-%d-%06d', $year, $tenantId, $sequenceNumber);

        $debitNote = DebitNote::create([
            'note_number' => $noteNumber,
            'sequence_number' => $sequenceNumber,
            'tenant_id' => $tenantId,
            'customer_id' => $policy->customer_id,
            'policy_id' => $policy->id,
            'broker_id' => $user->isBroker() ? $user->id : null,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'total_amount' => $data['amount'] + ($data['tax_amount'] ?? 0),
            'description' => $data['description'] ?? 'Debit Note for Policy #'.$policy->policy_number_display,
            'issue_date' => now()->format('Y-m-d'),
            'due_date' => $data['due_date'] ?? now()->addDays(30)->format('Y-m-d'),
            'created_by_id' => $user->id,
            'items' => $data['items'] ?? null,
            'premium_breakdown' => $policy->coverage_details,
            'currency_code' => 'NGN',
        ]);

        return $debitNote;
    }

    public function createCreditNoteFromPolicy(Policy $policy, User $user, array $data): CreditNote
    {
        $tenantId = $policy->tenant_id;
        $sequenceNumber = $this->getNextSequenceNumber('credit', $tenantId);
        $year = now()->year;

        $noteNumber = sprintf('CN-%d-%d-%06d', $year, $tenantId, $sequenceNumber);

        $creditNote = CreditNote::create([
            'note_number' => $noteNumber,
            'sequence_number' => $sequenceNumber,
            'tenant_id' => $tenantId,
            'customer_id' => $policy->customer_id,
            'policy_id' => $policy->id,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'total_amount' => $data['amount'] + ($data['tax_amount'] ?? 0),
            'description' => $data['description'] ?? 'Credit Note for Policy #'.$policy->policy_number_display,
            'issue_date' => now()->format('Y-m-d'),
            'created_by_id' => $user->id,
            'items' => $data['items'] ?? null,
            'currency_code' => 'NGN',
        ]);

        return $creditNote;
    }

    private function getNextSequenceNumber(string $type, int $tenantId): int
    {
        return DB::transaction(function () use ($type, $tenantId) {
            $model = $type === 'debit' ? DebitNote::class : CreditNote::class;

            $latestNote = $model::where('tenant_id', $tenantId)
                ->orderBy('sequence_number', 'desc')
                ->lockForUpdate()
                ->first();

            return $latestNote ? $latestNote->sequence_number + 1 : 1;
        });
    }
}
