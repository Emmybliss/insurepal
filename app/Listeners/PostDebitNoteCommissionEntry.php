<?php

namespace App\Listeners;

use App\Events\DebitNoteGenerated;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Log;

class PostDebitNoteCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
    ) {}

    public function handle(DebitNoteGenerated $event): void
    {
        $debitNote = $event->debitNote;

        if (! $debitNote->policy_id) {
            return;
        }

        try {
            $this->commissionPostingService->postDebitNoteEntry(
                $debitNote->policy,
                $debitNote->amount,
                $debitNote->id,
                $debitNote->createdBy,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post debit note commission entry', [
                'debit_note_id' => $debitNote->id,
                'policy_id' => $debitNote->policy_id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
