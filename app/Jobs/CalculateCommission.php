<?php

namespace App\Jobs;

use App\Events\PaymentReceived;
use App\Events\PolicyIssued;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CalculateCommission implements ShouldQueue
{
    use InteractsWithQueue, Queueable;

    public function __construct() {}

    public function handle(PolicyIssued|PaymentReceived $event): void
    {
        $policy = match (true) {
            $event instanceof PolicyIssued => $event->policy,
            $event instanceof PaymentReceived => $event->policy,
        };

        Log::info('Commission calculation queued', [
            'policy_id' => $policy->id,
            'policy_number' => $policy->policy_number,
        ]);
    }
}
