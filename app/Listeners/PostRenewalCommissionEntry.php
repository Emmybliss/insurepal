<?php

namespace App\Listeners;

use App\Events\PolicyRenewed;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Log;

class PostRenewalCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
    ) {}

    public function handle(PolicyRenewed $event): void
    {
        $policy = $event->policy;

        try {
            $renewalCommission = (float) ($policy->commission_amount ?? 0);

            if ($renewalCommission <= 0) {
                return;
            }

            $this->commissionPostingService->postRenewalEntry(
                $policy,
                $renewalCommission,
                null,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post renewal commission entry', [
                'policy_id' => $policy->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
