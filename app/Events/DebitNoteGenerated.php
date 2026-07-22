<?php

namespace App\Events;

use App\Models\DebitNote;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DebitNoteGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public DebitNote $debitNote,
    ) {}
}
