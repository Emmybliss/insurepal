<?php

namespace App\Listeners;

use App\Events\PolicyCancelled;
use App\Services\CommissionPostingService;
use App\Services\CommissionQueryService;
use Illuminate\Support\Facades\Log;

class PostCancellationCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
        protected CommissionQueryService $commissionQueryService,
    ) {}

    public function handle(PolicyCancelled $event): void
    {
        $policy = $event->policy;

        try {
            $currentBalance = $this->commissionQueryService->getCommissionBalance($policy);

            $this->commissionPostingService->postCancellationEntry(
                $policy,
                $currentBalance,
                null,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post cancellation commission entry', [
                'policy_id' => $policy->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
