<?php

namespace App\Listeners;

use App\Events\CreditNoteGenerated;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Log;

class PostCreditNoteCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
    ) {}

    public function handle(CreditNoteGenerated $event): void
    {
        $creditNote = $event->creditNote;

        if (! $creditNote->policy_id) {
            return;
        }

        try {
            $this->commissionPostingService->postCreditNoteEntry(
                $creditNote->policy,
                $creditNote->amount,
                $creditNote->id,
                $creditNote->createdBy,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post credit note commission entry', [
                'credit_note_id' => $creditNote->id,
                'policy_id' => $creditNote->policy_id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
