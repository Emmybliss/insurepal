<?php

namespace App\Jobs;

use App\Events\PolicyIssued;
use App\Events\PolicyRenewed;
use App\Models\BrokerSlipEmailLog;
use App\Services\Email\EmailSendService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPolicyEmailNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable;

    public function __construct() {}

    public function handle(PolicyIssued|PolicyRenewed $event): void
    {
        $policy = $event->policy;
        $customer = $policy->customer;

        if (! $customer || ! $customer->email) {
            Log::info('No customer email for policy notification', [
                'policy_id' => $policy->id,
            ]);

            return;
        }

        $tenant = $policy->tenant;
        $subject = "Policy {$policy->policy_number} Notification";
        $body = "Your policy {$policy->policy_number} has been updated.";

        $subject = str_replace(
            ['{{policy_number}}', '{{customer_name}}'],
            [$policy->policy_number, $customer->full_name ?? $customer->name ?? ''],
            $subject,
        );
        $body = str_replace(
            ['{{policy_number}}', '{{customer_name}}'],
            [$policy->policy_number, $customer->full_name ?? $customer->name ?? ''],
            $body,
        );

        $account = $tenant->emailAccounts()->where('is_active', true)->first();

        if (! $account) {
            Log::warning('No active email account for tenant', [
                'tenant_id' => $tenant->id,
                'policy_id' => $policy->id,
            ]);

            return;
        }

        $sendService = app(EmailSendService::class);
        $result = $sendService->send(
            $account,
            $customer->email,
            $subject,
            strip_tags($body),
            $body,
        );

        BrokerSlipEmailLog::create([
            'tenant_id' => $tenant->id,
            'broker_slip_id' => $policy->id,
            'recipient_email' => $customer->email,
            'recipient_name' => $customer->full_name ?? $customer->name ?? '',
            'subject' => $subject,
            'message' => $body,
            'delivery_status' => $result['success'] ? 'sent' : 'failed',
            'failure_reason' => $result['error'] ?? null,
            'sent_at' => now(),
        ]);
    }
}
