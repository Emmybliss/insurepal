<?php

namespace App\Listeners;

use App\Events\ClaimStatusChanged;
use App\Services\DebitNoteService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class ClaimStatusChangeListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected DebitNoteService $debitNoteService
    ) {}

    public function handle(ClaimStatusChanged $event): void
    {
        $claim = $event->claim;

        if ($event->newStatus === 'approved') {
            try {
                $this->debitNoteService->createFromPolicy(
                    $claim->policy,
                    [
                        'amount' => $claim->approved_amount ?? $claim->claim_amount,
                        'description' => 'Debit Note for Approved Claim #'.$claim->claim_reference,
                    ],
                    $event->user->id
                );
            } catch (\Exception $e) {
                Log::error('Failed to generate debit note for approved claim', [
                    'claim_id' => $claim->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Claim status changed', [
            'claim_id' => $claim->id,
            'old_status' => $event->oldStatus,
            'new_status' => $event->newStatus,
            'changed_by' => $event->user->id,
        ]);
    }
}
