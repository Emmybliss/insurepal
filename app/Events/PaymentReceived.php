<?php

namespace App\Events;

use App\Models\Policy;
use App\Models\PolicyPayment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReceived
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public PolicyPayment $payment,
        public Policy $policy,
    ) {}
}
