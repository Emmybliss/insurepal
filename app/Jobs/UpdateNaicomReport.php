<?php

namespace App\Jobs;

use App\Events\CreditNoteGenerated;
use App\Events\DebitNoteGenerated;
use App\Events\PaymentReceived;
use App\Events\PolicyCancelled;
use App\Events\PolicyIssued;
use App\Events\PolicyRenewed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UpdateNaicomReport implements ShouldQueue
{
    use InteractsWithQueue, Queueable;

    public function __construct() {}

    public function handle(
        PolicyIssued|PolicyCancelled|PolicyRenewed|PaymentReceived|DebitNoteGenerated|CreditNoteGenerated $event
    ): void {
        $entityType = match (true) {
            $event instanceof PolicyIssued,
            $event instanceof PolicyCancelled,
            $event instanceof PolicyRenewed => 'policy',

            $event instanceof PaymentReceived => 'payment',

            $event instanceof DebitNoteGenerated => 'debit_note',

            $event instanceof CreditNoteGenerated => 'credit_note',
        };

        $entityId = match (true) {
            $event instanceof PolicyIssued,
            $event instanceof PolicyCancelled,
            $event instanceof PolicyRenewed => $event->policy->id,

            $event instanceof PaymentReceived => $event->payment->id,

            $event instanceof DebitNoteGenerated => $event->debitNote->id,

            $event instanceof CreditNoteGenerated => $event->creditNote->id,
        };

        Log::info('NAICOM report update queued', [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }
}
