<?php

namespace App\Console\Commands;

use App\Models\Policy;
use App\Models\PolicyNotificationLog;
use App\Notifications\PolicyRenewalNotice;
use App\Services\SmsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessPolicyExpirations extends Command
{
    protected $signature = 'policies:process-expirations {--channels=email,sms,portal : Comma-separated notification channels}';

    protected $description = 'Process policy expirations and send auto-renewal notices';

    public function handle(SmsService $smsService)
    {
        $this->info('Processing policy expirations...');

        $channels = array_map('trim', explode(',', $this->option('channels')));

        $policiesToNotify = Policy::whereIn('status', [Policy::STATUS_ACTIVE, Policy::STATUS_EXPIRED])
            ->where('auto_renewal_notification', true)
            ->whereNull('renewed_at')
            ->where(function ($q) {
                $q->whereDate('expiry_date', '<', now()->toDateString())
                    ->orWhereDate('expiry_date', '<=', now()->addDays(60)->toDateString());
            })
            ->with('customer')
            ->get();

        $notifiedCount = 0;

        foreach ($policiesToNotify as $policy) {
            $noticeType = $policy->isExpired() ? 'expired' : 'expiring';

            $recentlyNotified = PolicyNotificationLog::where('policy_id', $policy->id)
                ->where('notice_type', $noticeType)
                ->where('created_at', '>=', now()->subDays(7))
                ->exists();

            if ($recentlyNotified || ! $policy->customer) {
                continue;
            }

            try {
                DB::transaction(function () use ($policy, $noticeType, $channels, $smsService) {
                    foreach ($channels as $channel) {
                        $this->sendViaChannel($policy, $noticeType, $channel, $smsService);
                    }
                });

                $notifiedCount++;
            } catch (\Exception $e) {
                $this->error("Failed to notify policy {$policy->id}: ".$e->getMessage());
            }
        }

        $this->info("Sent auto-notices for {$notifiedCount} policies.");
        $this->info('Done processing policy expirations.');
    }

    protected function sendViaChannel(Policy $policy, string $noticeType, string $channel, SmsService $smsService): void
    {
        $isSuccessful = false;
        $errorMessage = null;
        $recipient = match ($channel) {
            'email' => $policy->customer->email ?? 'unknown',
            'sms' => $policy->customer->phone ?? 'unknown',
            default => (string) $policy->customer->id,
        };

        try {
            match ($channel) {
                'sms' => $isSuccessful = $smsService->sendRenewalNotice($policy, $noticeType),
                'portal' => $policy->customer->notify(new PolicyRenewalNotice($policy, $noticeType, 'portal')),
                default => $policy->customer->notify(new PolicyRenewalNotice($policy, $noticeType, 'email')),
            };

            $isSuccessful = true;
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
        }

        PolicyNotificationLog::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'channel' => $channel,
            'recipient' => $recipient,
            'is_successful' => $isSuccessful,
            'error_message' => $errorMessage,
            'notice_type' => $noticeType,
        ]);
    }
}
