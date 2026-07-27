<?php

namespace App\Console\Commands;

use App\Enums\CommissionTransactionType;
use App\Models\CommissionEntry;
use App\Models\Policy;
use Illuminate\Console\Command;

class InsuranceBackfillCommissionLedger extends Command
{
    protected $signature = 'insurance:backfill-commission-ledger
                            {--dry-run : Show what would be inserted without writing}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Backfill historical commission data from legacy tables into the commission_entries ledger';

    private array $stats = [
        'policy_created' => 0,
        'policy_skipped' => 0,
        'policy_errors' => 0,
        'credit_note_created' => 0,
        'credit_note_skipped' => 0,
        'credit_note_errors' => 0,
        'debit_note_created' => 0,
        'debit_note_skipped' => 0,
        'debit_note_errors' => 0,
        'cancellation_created' => 0,
        'cancellation_skipped' => 0,
        'cancellation_errors' => 0,
        'flagged_amendments' => 0,
        'validation_mismatches' => 0,
    ];

    private array $flaggedAmendments = [];

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->option('dry-run')) {
            $this->info('This will backfill historical commission data into the commission_entries ledger.');
            $this->info('Use --dry-run to preview changes without applying them.');
            $this->info('Use --force to skip this prompt.');

            if (! $this->confirm('Do you wish to continue?')) {
                $this->info('Command cancelled.');

                return Command::SUCCESS;
            }
        }

        $this->info('Starting commission ledger backfill...');

        $this->backfillPolicyEntries();
        $this->backfillCreditNoteEntries();
        $this->backfillCancellationEntries();
        $this->flagAmendmentsForReview();

        if (! $this->option('dry-run')) {
            $this->runValidation();
        }

        $this->printSummary();

        if (! $this->option('dry-run') && $this->stats['validation_mismatches'] > 0) {
            $this->warn('Validation found mismatches. Review the report above.');

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    protected function backfillPolicyEntries(): void
    {
        $this->line("\n[1/5] Backfilling POLICY entries from policies.commission_amount...");

        $policies = Policy::where('commission_amount', '>', 0)
            ->whereNotNull('commission_amount')
            ->get();

        $progress = $this->output->createProgressBar($policies->count());
        $progress->start();

        foreach ($policies as $policy) {
            try {
                $exists = CommissionEntry::where('policy_id', $policy->id)
                    ->where('transaction_type', CommissionTransactionType::Policy->value)
                    ->where('reference_type', 'policy')
                    ->where('reference_id', $policy->id)
                    ->exists();

                if ($exists) {
                    $this->stats['policy_skipped']++;
                    $progress->advance();

                    continue;
                }

                if ($this->option('dry-run')) {
                    $this->stats['policy_created']++;
                    $progress->advance();

                    continue;
                }

                CommissionEntry::create([
                    'tenant_id' => $policy->tenant_id,
                    'policy_id' => $policy->id,
                    'transaction_type' => CommissionTransactionType::Policy,
                    'reference_type' => 'policy',
                    'reference_id' => $policy->id,
                    'amount' => (float) $policy->commission_amount,
                    'posting_date' => $policy->effective_date ?? $policy->created_at,
                    'description' => 'Backfill: initial policy commission',
                    'created_by' => $policy->created_by,
                ]);

                $this->stats['policy_created']++;
            } catch (\Exception $e) {
                $this->stats['policy_errors']++;
                $this->error("\nError backfilling policy #{$policy->id}: {$e->getMessage()}");
            }

            $progress->advance();
        }

        $progress->finish();
        $this->line('');
    }

    protected function backfillCreditNoteEntries(): void
    {
        $this->line("\n[2/5] Backfilling CREDIT_NOTE entries from credit_notes...");

        $creditNotes = \App\Models\CreditNote::whereIn('status', ['issued', 'paid'])
            ->whereNotNull('policy_id')
            ->where('amount', '>', 0)
            ->get();

        $progress = $this->output->createProgressBar($creditNotes->count());
        $progress->start();

        foreach ($creditNotes as $creditNote) {
            try {
                $policyExists = Policy::where('id', $creditNote->policy_id)->exists();

                if (! $policyExists) {
                    $this->stats['credit_note_skipped']++;
                    $this->warn("\nSkipping credit note #{$creditNote->id}: policy #{$creditNote->policy_id} not found");
                    $progress->advance();

                    continue;
                }

                $exists = CommissionEntry::where('policy_id', $creditNote->policy_id)
                    ->where('transaction_type', CommissionTransactionType::CreditNote->value)
                    ->where('reference_type', 'credit_note')
                    ->where('reference_id', $creditNote->id)
                    ->exists();

                if ($exists) {
                    $this->stats['credit_note_skipped']++;
                    $progress->advance();

                    continue;
                }

                if ($this->option('dry-run')) {
                    $this->stats['credit_note_created']++;
                    $progress->advance();

                    continue;
                }

                $policy = Policy::find($creditNote->policy_id);

                CommissionEntry::create([
                    'tenant_id' => $policy->tenant_id,
                    'policy_id' => $policy->id,
                    'transaction_type' => CommissionTransactionType::CreditNote,
                    'reference_type' => 'credit_note',
                    'reference_id' => $creditNote->id,
                    'amount' => -abs((float) $creditNote->amount),
                    'posting_date' => $creditNote->issue_date ?? $creditNote->created_at,
                    'description' => 'Backfill: credit note adjustment',
                    'created_by' => $creditNote->created_by_id,
                ]);

                $this->stats['credit_note_created']++;
            } catch (\Exception $e) {
                $this->stats['credit_note_errors']++;
                $this->error("\nError backfilling credit note #{$creditNote->id}: {$e->getMessage()}");
            }

            $progress->advance();
        }

        $progress->finish();
        $this->line('');
    }

    protected function backfillCancellationEntries(): void
    {
        $this->line("\n[4/5] Backfilling CANCELLATION entries from cancelled policies...");

        $cancelledPolicies = Policy::where('status', Policy::STATUS_CANCELLED)
            ->where('commission_amount', '>', 0)
            ->get();

        $progress = $this->output->createProgressBar($cancelledPolicies->count());
        $progress->start();

        foreach ($cancelledPolicies as $policy) {
            try {
                $hasPolicyEntry = CommissionEntry::where('policy_id', $policy->id)
                    ->where('transaction_type', CommissionTransactionType::Policy->value)
                    ->exists();

                if (! $hasPolicyEntry) {
                    $this->stats['cancellation_skipped']++;
                    $this->warn("\nSkipping cancellation for policy #{$policy->id}: no POLICY entry found");
                    $progress->advance();

                    continue;
                }

                $exists = CommissionEntry::where('policy_id', $policy->id)
                    ->where('transaction_type', CommissionTransactionType::Cancellation->value)
                    ->where('reference_type', 'policy')
                    ->where('reference_id', $policy->id)
                    ->exists();

                if ($exists) {
                    $this->stats['cancellation_skipped']++;
                    $progress->advance();

                    continue;
                }

                if ($this->option('dry-run')) {
                    $this->stats['cancellation_created']++;
                    $progress->advance();

                    continue;
                }

                CommissionEntry::create([
                    'tenant_id' => $policy->tenant_id,
                    'policy_id' => $policy->id,
                    'transaction_type' => CommissionTransactionType::Cancellation,
                    'reference_type' => 'policy',
                    'reference_id' => $policy->id,
                    'amount' => -abs((float) $policy->commission_amount),
                    'posting_date' => $policy->updated_at->startOfDay(),
                    'description' => 'Backfill: policy cancellation',
                    'created_by' => $policy->created_by,
                ]);

                $this->stats['cancellation_created']++;
            } catch (\Exception $e) {
                $this->stats['cancellation_errors']++;
                $this->error("\nError backfilling cancellation for policy #{$policy->id}: {$e->getMessage()}");
            }

            $progress->advance();
        }

        $progress->finish();
        $this->line('');
    }

    protected function flagAmendmentsForReview(): void
    {
        $this->line("\n[5/5] Flagging amendments for manual review...");

        $amendments = \App\Models\PolicyAmendment::where('status', 'active')
            ->where('premium_adjustment', '!=', 0)
            ->get();

        if ($amendments->isEmpty()) {
            $this->info('  No amendments with premium adjustments found.');

            return;
        }

        $this->flaggedAmendments = $amendments->map(function ($amendment) {
            return [
                'amendment_id' => $amendment->id,
                'policy_id' => $amendment->policy_id,
                'premium_adjustment' => $amendment->premium_adjustment,
                'reason' => 'Commission delta cannot be reliably determined from JSON amended_data',
                'suggested_action' => 'Create ENDORSEMENT entry manually after reviewing amendment context',
            ];
        })->toArray();

        $this->stats['flagged_amendments'] = count($this->flaggedAmendments);

        $this->warn("  Flagged {$this->stats['flagged_amendments']} amendment(s) for manual review.");

        $header = ['Amendment ID', 'Policy ID', 'Premium Adjustment', 'Reason'];
        $rows = array_map(fn ($f) => [$f['amendment_id'], $f['policy_id'], number_format($f['premium_adjustment'], 2), $f['reason']], $this->flaggedAmendments);

        $this->table($header, $rows);

        if (! $this->option('dry-run')) {
            // Write flag report to log as well
            logger()->warning('Commission ledger backfill flagged amendments for manual review', [
                'amendments' => $this->flaggedAmendments,
            ]);
        }
    }

    protected function runValidation(): void
    {
        $this->line("\nRunning validation: comparing ledger totals against legacy values...");

        $policies = Policy::where('commission_amount', '>', 0)
            ->whereHas('commissionEntries')
            ->get();

        $mismatches = 0;

        foreach ($policies as $policy) {
            $ledgerTotal = (float) CommissionEntry::where('policy_id', $policy->id)->sum('amount');

            $creditNoteTotal = (float) \App\Models\CreditNote::where('policy_id', $policy->id)
                ->whereIn('status', ['issued', 'paid'])
                ->sum('amount');

            if ($policy->status === Policy::STATUS_CANCELLED) {
                $expected = 0.0; // cancellation entries offset the original commission
            } else {
                $expected = (float) $policy->commission_amount - $creditNoteTotal;
            }

            if (abs($ledgerTotal - $expected) > 0.01) {
                $mismatches++;
                $this->stats['validation_mismatches']++;

                $this->warn(sprintf(
                    '  MISMATCH: Policy #%d | Ledger: %0.2f | Expected: %0.2f (commission: %0.2f - CN: %0.2f)',
                    $policy->id,
                    $ledgerTotal,
                    $expected,
                    (float) $policy->commission_amount,
                    $creditNoteTotal,
                ));
            }
        }

        if ($mismatches === 0) {
            $this->info('  ✓ Validation passed: all ledger totals match expected values.');
        } else {
            $this->warn("  ✗ {$mismatches} policy/ledger mismatch(es) found.");
        }
    }

    protected function printSummary(): void
    {
        $this->line("\n═══════════════════════════════════════");
        $this->info('         Backfill Summary');
        $this->line('═══════════════════════════════════════');

        $mode = $this->option('dry-run') ? 'DRY RUN (no changes written)' : 'LIVE';

        $this->line("  Mode:               {$mode}");
        $this->line("  Policy entries:     {$this->stats['policy_created']} created, {$this->stats['policy_skipped']} skipped, {$this->stats['policy_errors']} errors");
        $this->line("  Credit note entries: {$this->stats['credit_note_created']} created, {$this->stats['credit_note_skipped']} skipped, {$this->stats['credit_note_errors']} errors");
        $this->line("  Debit note entries:  {$this->stats['debit_note_created']} created, {$this->stats['debit_note_skipped']} skipped, {$this->stats['debit_note_errors']} errors");
        $this->line("  Cancellation entries: {$this->stats['cancellation_created']} created, {$this->stats['cancellation_skipped']} skipped, {$this->stats['cancellation_errors']} errors");
        $this->line("  Flagged amendments: {$this->stats['flagged_amendments']}");

        if (! $this->option('dry-run')) {
            $this->line("  Validation mismatches: {$this->stats['validation_mismatches']}");
        }

        $this->line('───────────────────────────────────────');
    }
}
