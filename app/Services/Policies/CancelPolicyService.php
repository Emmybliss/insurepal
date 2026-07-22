<?php

namespace App\Services\Policies;

use App\Events\PolicyCancelled;
use App\Models\Policy;
use Illuminate\Support\Facades\Log;

class CancelPolicyService
{
    public function cancel(Policy $policy, ?string $reason = null): void
    {
        $policy->cancel($reason);

        PolicyCancelled::dispatch($policy);

        Log::info('Policy cancelled', [
            'policy_id' => $policy->id,
            'policy_number' => $policy->policy_number,
            'reason' => $reason,
        ]);
    }

    public function suspend(Policy $policy, ?string $reason = null): void
    {
        $policy->suspend($reason);
    }

    public function reinstate(Policy $policy): void
    {
        $policy->reinstate();
    }
}
