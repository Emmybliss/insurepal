<?php

namespace App\Services;

use App\Models\Policy;
use App\Models\PolicyNotification;
use App\Notifications\PolicyExpiryNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PolicyNotificationService
{
    /**
     * Determine the notification stage based on days until expiry.
     */
    public function getStageForDays(int $daysUntilExpiry): ?string
    {
        if ($daysUntilExpiry === 60) {
            return '60_days';
        }
        if ($daysUntilExpiry === 30) {
            return '30_days';
        }
        if ($daysUntilExpiry === 14) {
            return '14_days';
        }
        if ($daysUntilExpiry === 7) {
            return '7_days';
        }
        if ($daysUntilExpiry < 7 && $daysUntilExpiry > 0) {
            return 'daily';
        }
        if ($daysUntilExpiry === 0) {
            return 'expiry_day';
        }

        return null;
    }

    /**
     * Process all active policies and send expiry notifications if conditions are met.
     */
    public function processExpiryNotifications(): void
    {
        // Get all active policies that have not expired yet
        Policy::whereDate('expiry_date', '>=', now()->startOfDay())
            ->whereIn('status', ['active']) // ensure they are active
            ->with('customer') // Eager load customer
            ->chunk(100, function ($policies) {
                foreach ($policies as $policy) {
                    $this->processPolicy($policy);
                }
            });
    }

    protected function processPolicy(Policy $policy): void
    {
        if (! $policy->expiry_date) {
            return;
        }

        $today = Carbon::now()->startOfDay();
        $expiryDate = Carbon::parse($policy->expiry_date)->startOfDay();

        if ($expiryDate->lessThan($today)) {
            return; // Already expired, skip.
        }

        $daysUntilExpiry = $today->diffInDays($expiryDate);

        $stage = $this->getStageForDays($daysUntilExpiry);

        if (! $stage) {
            return;
        }

        // Check if notification already sent
        $alreadySent = PolicyNotification::where('policy_id', $policy->id)
            ->where('stage', $stage)
            ->exists();

        if ($alreadySent) {
            return; // Skip if already notified for this stage
        }

        $customer = $policy->customer;

        if ($customer) {
            try {
                $customer->notify(new PolicyExpiryNotification($policy, $stage, $daysUntilExpiry));

                // Log into DB
                PolicyNotification::create([
                    'policy_id' => $policy->id,
                    'stage' => $stage,
                    'sent_at' => now(),
                ]);

                Log::info("Sent {$stage} policy expiry notification for Policy ID: {$policy->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send {$stage} policy expiry notification for Policy ID: {$policy->id}. Error: ".$e->getMessage());
            }
        }
    }
}
