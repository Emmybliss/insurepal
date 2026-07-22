<?php

namespace App\Listeners;

use App\Events\PolicyAmended;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Log;

class PostEndorsementCommissionEntry
{
    public function __construct(
        protected CommissionPostingService $commissionPostingService,
    ) {}

    public function handle(PolicyAmended $event): void
    {
        if ($event->commissionDelta === 0.0) {
            return;
        }

        try {
            $this->commissionPostingService->postEndorsementEntry(
                $event->policy,
                $event->commissionDelta,
                $event->amendment->id,
                null,
            );
        } catch (\Exception $e) {
            Log::error('Failed to post endorsement commission entry', [
                'policy_id' => $event->policy->id,
                'amendment_id' => $event->amendment->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
