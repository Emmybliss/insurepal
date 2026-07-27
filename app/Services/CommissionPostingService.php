<?php

namespace App\Services;

use App\Enums\CommissionTransactionType;
use App\Models\CommissionEntry;
use App\Models\CommissionEntryAudit;
use App\Models\Policy;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommissionPostingService
{
    public function postEntry(
        Policy $policy,
        CommissionTransactionType $type,
        float $amount,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $description = null,
        ?User $createdBy = null,
    ): CommissionEntry {
        return DB::transaction(function () use ($policy, $type, $amount, $referenceType, $referenceId, $description, $createdBy) {
            $entry = CommissionEntry::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'transaction_type' => $type,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'amount' => $amount,
                'posting_date' => now()->startOfDay(),
                'description' => $description,
                'created_by' => $createdBy?->id,
            ]);

            $this->recordAudit($entry, 'created', null, null, $createdBy, 'Initial posting');

            Log::info('Commission entry posted', [
                'entry_id' => $entry->id,
                'policy_id' => $policy->id,
                'type' => $type->value,
                'amount' => $amount,
            ]);

            return $entry;
        });
    }

    public function updateEntry(
        CommissionEntry $entry,
        array $changes,
        User $changedBy,
        string $reason,
    ): CommissionEntry {
        return DB::transaction(function () use ($entry, $changes, $changedBy, $reason) {
            $originalAmount = $entry->amount;
            $originalType = $entry->transaction_type;

            $entry->update($changes);

            $this->recordAudit(
                $entry,
                'updated',
                $originalAmount,
                $entry->amount,
                $changedBy,
                $reason,
                $originalType?->value,
                $entry->transaction_type?->value,
            );

            Log::info('Commission entry updated', [
                'entry_id' => $entry->id,
                'reason' => $reason,
                'changed_by' => $changedBy->id,
            ]);

            return $entry->fresh();
        });
    }

    public function reverseEntry(
        CommissionEntry $entry,
        User $changedBy,
        string $reason,
    ): CommissionEntry {
        return DB::transaction(function () use ($entry, $changedBy, $reason) {
            $reversal = CommissionEntry::create([
                'tenant_id' => $entry->tenant_id,
                'policy_id' => $entry->policy_id,
                'transaction_type' => CommissionTransactionType::Reversal,
                'reference_type' => $entry->reference_type,
                'reference_id' => $entry->reference_id,
                'amount' => -$entry->amount,
                'posting_date' => now()->startOfDay(),
                'description' => sprintf('Reversal of entry #%d: %s', $entry->id, $reason),
                'created_by' => $changedBy->id,
            ]);

            $this->recordAudit(
                $entry,
                'reversed',
                null,
                null,
                $changedBy,
                $reason,
            );

            $this->recordAudit(
                $reversal,
                'created',
                null,
                null,
                $changedBy,
                sprintf('Reversal of entry #%d: %s', $entry->id, $reason),
            );

            Log::info('Commission entry reversed', [
                'original_entry_id' => $entry->id,
                'reversal_entry_id' => $reversal->id,
                'reason' => $reason,
                'changed_by' => $changedBy->id,
            ]);

            return $reversal;
        });
    }

    public function postPolicyEntry(Policy $policy, float $commissionAmount, ?User $createdBy = null): CommissionEntry
    {
        return $this->postEntry(
            $policy,
            CommissionTransactionType::Policy,
            $commissionAmount,
            'policy',
            $policy->id,
            'Initial policy commission',
            $createdBy,
        );
    }

    public function postCreditNoteEntry(Policy $policy, float $amount, int $creditNoteId, ?User $createdBy = null): CommissionEntry
    {
        return $this->postEntry(
            $policy,
            CommissionTransactionType::CreditNote,
            -abs($amount),
            'credit_note',
            $creditNoteId,
            'Credit note adjustment',
            $createdBy,
        );
    }

    public function postCancellationEntry(Policy $policy, float $commissionAmount, ?User $createdBy = null): CommissionEntry
    {
        return $this->postEntry(
            $policy,
            CommissionTransactionType::Cancellation,
            -abs($commissionAmount),
            'policy',
            $policy->id,
            'Policy cancellation',
            $createdBy,
        );
    }

    public function postRenewalEntry(Policy $policy, float $commissionAmount, ?User $createdBy = null): CommissionEntry
    {
        return $this->postEntry(
            $policy,
            CommissionTransactionType::Renewal,
            $commissionAmount,
            'policy',
            $policy->id,
            'Policy renewal commission',
            $createdBy,
        );
    }

    public function postEndorsementEntry(Policy $policy, float $commissionDelta, int $amendmentId, ?User $createdBy = null): CommissionEntry
    {
        return $this->postEntry(
            $policy,
            CommissionTransactionType::Endorsement,
            $commissionDelta,
            'policy_amendment',
            $amendmentId,
            'Endorsement commission adjustment',
            $createdBy,
        );
    }

    protected function recordAudit(
        CommissionEntry $entry,
        string $action,
        ?float $originalAmount = null,
        ?float $newAmount = null,
        ?User $changedBy = null,
        ?string $reason = null,
        ?string $originalType = null,
        ?string $newType = null,
    ): void {
        $changedById = $changedBy?->id ?? $entry->created_by;

        if ($changedById === null) {
            return;
        }

        CommissionEntryAudit::create([
            'commission_entry_id' => $entry->id,
            'action' => $action,
            'original_amount' => $originalAmount,
            'new_amount' => $newAmount,
            'original_transaction_type' => $originalType,
            'new_transaction_type' => $newType,
            'changed_by' => $changedById,
            'reason' => $reason ?? 'No reason provided',
        ]);
    }
}
