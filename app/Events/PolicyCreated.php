<?php

namespace App\Events;

use App\Models\Policy;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PolicyCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Policy $policy,
        public float $commissionAmount,
        public ?User $createdBy = null,
    ) {}
}
