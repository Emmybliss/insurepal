<?php

namespace App\Services\Policies;

use App\Events\PolicyRenewed;
use App\Models\Policy;
use Illuminate\Support\Facades\Log;

class RenewPolicyService
{
    public function renew(Policy $policy, array $data): void
    {
        $policy->update([
            'renewed_at' => now(),
            'expiry_date' => $data['new_expiry_date'],
            'premium_amount' => $data['new_premium'],
            'notes' => $data['renewal_notes'] ?? $policy->notes,
        ]);

        PolicyRenewed::dispatch($policy->fresh());

        Log::info('Policy renewed', [
            'policy_id' => $policy->id,
            'policy_number' => $policy->policy_number,
        ]);
    }
}
