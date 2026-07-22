<?php

namespace App\Events;

use App\Models\Policy;
use App\Models\PolicyAmendment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PolicyAmended
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Policy $policy,
        public PolicyAmendment $amendment,
        public float $commissionDelta,
    ) {}
}
