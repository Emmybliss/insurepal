<?php

namespace App\Listeners;

use App\Events\PolicyCreated;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Log;

class PostPolicyCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
    ) {}

    public function handle(PolicyCreated $event): void
    {
        try {
            $this->commissionPostingService->postPolicyEntry(
                $event->policy,
                $event->commissionAmount,
                $event->createdBy,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post policy commission entry', [
                'policy_id' => $event->policy->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
