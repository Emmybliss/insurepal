<?php

namespace App\Services\Policies;

use App\Models\Claim;
use App\Models\CommissionEntry;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\PolicyPayment;
use App\Models\Receipt;
use App\Models\ReceiptAllocation;
use Exception;
use Illuminate\Support\Facades\DB;

class PolicyDependencyService
{
    /**
     * Check if a policy has any dependent active financial or regulatory records.
     */
    public function hasDependencies(Policy $policy): bool
    {
        return $this->getDependencyError($policy) !== null;
    }

    /**
     * Collect all active (non-trashed) financial records blocking deletion,
     * keyed by record type with human-readable references.
     *
     * @return array<string, list<string>>
     */
    public function getBlockingRecords(Policy $policy): array
    {
        $policyId = $policy->id;
        $blocking = [];

        // Debit Notes (active/non-trashed only)
        $debitNotes = DebitNote::where('policy_id', $policyId)->get(['id', 'note_number']);
        if ($debitNotes->isNotEmpty()) {
            $blocking['Debit Note'] = $debitNotes->map(
                fn (DebitNote $dn) => $dn->note_number ?? "Debit Note #{$dn->id}"
            )->all();
        }

        // Credit Notes (active/non-trashed only)
        $creditNotes = CreditNote::where('policy_id', $policyId)->get(['id', 'note_number']);
        if ($creditNotes->isNotEmpty()) {
            $blocking['Credit Note'] = $creditNotes->map(
                fn (CreditNote $cn) => $cn->note_number ?? "Credit Note #{$cn->id}"
            )->all();
        }

        // Invoices (active/non-trashed only)
        $invoices = Invoice::where('policy_id', $policyId)->get(['id', 'invoice_number']);
        if ($invoices->isNotEmpty()) {
            $blocking['Invoice'] = $invoices->map(
                fn (Invoice $inv) => $inv->invoice_number ?? "Invoice #{$inv->id}"
            )->all();
        }

        // Receipts (active/non-trashed only)
        $receipts = Receipt::where('policy_id', $policyId)->get(['id', 'receipt_number']);
        if ($receipts->isNotEmpty()) {
            $blocking['Receipt'] = $receipts->map(
                fn (Receipt $r) => $r->receipt_number ?? "Receipt #{$r->id}"
            )->all();
        }

        // Receipt Allocations (via receipt, active only)
        $receiptAllocations = ReceiptAllocation::where('policy_id', $policyId)->get(['id']);
        if ($receiptAllocations->isNotEmpty()) {
            $blocking['Receipt Allocation'] = $receiptAllocations->map(
                fn (ReceiptAllocation $ra) => "Allocation #{$ra->id}"
            )->all();
        }

        // Claims (financially posted & non-trashed: submitted, under_review, info_requested, approved, settled, or closed)
        $financialClaimStatuses = [
            Claim::STATUS_SUBMITTED,
            Claim::STATUS_UNDER_REVIEW,
            Claim::STATUS_INFO_REQUESTED,
            Claim::STATUS_APPROVED,
            Claim::STATUS_SETTLED,
            Claim::STATUS_CLOSED,
        ];
        $claims = Claim::where('policy_id', $policyId)
            ->whereIn('status', $financialClaimStatuses)
            ->get(['id', 'claim_reference']);
        if ($claims->isNotEmpty()) {
            $blocking['Claim'] = $claims->map(
                fn (Claim $c) => $c->claim_reference ?? "Claim #{$c->id}"
            )->all();
        }

        // Commission Entries
        $commissions = CommissionEntry::where('policy_id', $policyId)->get(['id', 'description']);
        if ($commissions->isNotEmpty()) {
            $blocking['Commission Entry'] = $commissions->map(
                fn (CommissionEntry $ce) => $ce->description ?? "Commission Entry #{$ce->id}"
            )->all();
        }

        // Policy Payments (successful only)
        $payments = PolicyPayment::where('policy_id', $policyId)
            ->where('status', PolicyPayment::STATUS_SUCCESS)
            ->get(['id', 'reference']);
        if ($payments->isNotEmpty()) {
            $blocking['Payment'] = $payments->map(
                fn (PolicyPayment $pp) => $pp->reference ?? "Payment #{$pp->id}"
            )->all();
        }

        return $blocking;
    }

    /**
     * Get a human-readable validation error message if policy has active financial blocking records,
     * listing each blocking record by its reference number.
     */
    public function getDependencyError(Policy $policy): ?string
    {
        $blocking = $this->getBlockingRecords($policy);

        if (empty($blocking)) {
            return null;
        }

        $lines = [];
        foreach ($blocking as $type => $references) {
            foreach ($references as $reference) {
                $lines[] = "- {$type}: {$reference}";
            }
        }

        return implode("\n", [
            'This policy cannot be moved to the Recycle Bin because it is linked to the following financial documents:',
            implode("\n", $lines),
            '',
            'Move or permanently delete these documents first before deleting the policy.',
        ]);
    }

    /**
     * Soft delete a policy after validating active financial dependencies.
     *
     * @throws Exception
     */
    public function softDelete(Policy $policy): void
    {
        $dependencyError = $this->getDependencyError($policy);

        if ($dependencyError) {
            throw new Exception($dependencyError);
        }

        $policy->delete();
    }

    /**
     * Validate restoration of a trashed record (policy or financial document).
     * Returns error message if restoration is blocked, or null if allowed.
     */
    public function getRestoreError(object $record, string $type, bool $restorePolicy = false): ?string
    {
        // 1. Check Customer dependency if record has customer_id
        if (isset($record->customer_id) && $record->customer_id) {
            $customer = Customer::withTrashed()->find($record->customer_id);
            if (! $customer) {
                return 'Cannot restore this record because its linked Customer has been permanently deleted.';
            }
            if ($customer->trashed()) {
                $customerName = $customer->display_name ?? 'Customer #'.$customer->id;

                return "Restore the linked customer [{$customerName}] before restoring this record.";
            }
        }

        // 2. Check Policy dependency if record has policy_id (for financial documents)
        if ($type !== 'policies' && isset($record->policy_id) && $record->policy_id) {
            $policy = Policy::withTrashed()->find($record->policy_id);

            if (! $policy) {
                $typeName = match ($type) {
                    'debit-notes' => 'Debit Note',
                    'credit-notes' => 'Credit Note',
                    'invoices' => 'Invoice',
                    'receipts' => 'Receipt',
                    'claims' => 'Claim',
                    default => 'financial document',
                };

                return "Cannot restore this {$typeName} because its linked Policy has been permanently deleted.";
            }

            if ($policy->trashed() && ! $restorePolicy) {
                $policyRef = $policy->policy_number_display ?: $policy->policy_number;

                return "The linked Policy [{$policyRef}] is currently in the Recycle Bin. Please restore the Policy first or select 'Restore with Policy'.";
            }
        }

        return null;
    }

    /**
     * Restore a record (and optionally its linked parent Policy).
     *
     * @throws Exception
     */
    public function restoreRecord(object $record, string $type, bool $restorePolicy = false): string
    {
        $error = $this->getRestoreError($record, $type, $restorePolicy);
        if ($error) {
            throw new Exception($error);
        }

        DB::transaction(function () use ($record, $type, $restorePolicy) {
            if ($type !== 'policies' && isset($record->policy_id) && $record->policy_id && $restorePolicy) {
                $policy = Policy::onlyTrashed()->find($record->policy_id);
                if ($policy) {
                    $policy->restore();
                }
            }

            $record->restore();
        });

        if ($type !== 'policies' && isset($record->policy_id) && $record->policy_id && $restorePolicy) {
            $policy = Policy::withTrashed()->find($record->policy_id);
            $policyRef = $policy?->policy_number_display ?: $policy?->policy_number;

            return "Record restored successfully along with linked Policy [{$policyRef}].";
        }

        return 'Record restored successfully.';
    }

    /**
     * Force delete a soft-deleted policy after re-running dependency checks.
     *
     * @throws Exception
     */
    public function forceDelete(Policy $policy): void
    {
        $dependencyError = $this->getDependencyError($policy);

        if ($dependencyError) {
            throw new Exception($dependencyError);
        }

        $hasFinancialDocs = DebitNote::withTrashed()->where('policy_id', $policy->id)->exists() ||
            CreditNote::withTrashed()->where('policy_id', $policy->id)->exists() ||
            Invoice::withTrashed()->where('policy_id', $policy->id)->exists() ||
            Receipt::withTrashed()->where('policy_id', $policy->id)->exists() ||
            Claim::withTrashed()->where('policy_id', $policy->id)->exists();

        if ($hasFinancialDocs) {
            throw new Exception('Cannot permanently delete this policy because it has financial documents linked to it. Permanently delete those financial documents first.');
        }

        $policy->forceDelete();
    }
}
