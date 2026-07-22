<?php

namespace App\Events;

use App\Models\CreditNote;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CreditNoteGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CreditNote $creditNote,
    ) {}
}
