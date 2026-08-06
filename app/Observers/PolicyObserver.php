<?php

namespace App\Observers;

use App\Models\Policy;
use App\Services\CommissionPostingService;
use Illuminate\Support\Facades\Auth;

class PolicyObserver
{
    /**
     * Handle the Policy "updated" event.
     */
    public function updated(Policy $policy): void
    {
        if ($policy->wasChanged('commission_amount')) {
            app(CommissionPostingService::class)->syncPolicyCommissionEntry($policy, Auth::user());
        }
    }
}
