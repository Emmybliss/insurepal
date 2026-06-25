<?php

namespace App\Notifications;

use App\Mail\PolicyRenewalMail;
use App\Models\Policy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PolicyRenewalNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public Policy $policy;

    public string $noticeType; // 'expiring' | 'expired'

    public string $channel;    // 'email' | 'sms' | 'portal'

    public function __construct(Policy $policy, string $noticeType, string $channel = 'email')
    {
        $this->policy = $policy;
        $this->noticeType = $noticeType;
        $this->channel = $channel;
    }

    /**
     * Determine the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return match ($this->channel) {
            'portal' => ['database'],
            default => ['mail'],
        };
    }

    /**
     * Get the mail representation of the notification.
     * We return a pre-built Mailable which applies tenant-aware SMTP routing.
     */
    public function toMail(object $notifiable): PolicyRenewalMail
    {
        // Ensure relations are loaded for the mailable
        $this->policy->loadMissing(['customer', 'tenant', 'policyClass']);

        return new PolicyRenewalMail($this->policy, $this->noticeType);
    }

    /**
     * Get the database (portal) notification payload.
     */
    public function toArray(object $notifiable): array
    {
        $title = $this->noticeType === 'expired' ? 'Policy Expired' : 'Policy Expiring Soon';

        $expiryFormatted = $this->policy->expiry_date
            ? \Carbon\Carbon::parse($this->policy->expiry_date)->format('M d, Y')
            : 'N/A';

        $message = $this->noticeType === 'expired'
            ? "Your policy {$this->policy->policy_number} expired on {$expiryFormatted}."
            : "Your policy {$this->policy->policy_number} expires on {$expiryFormatted}.";

        return [
            'policy_id' => $this->policy->id,
            'policy_number' => $this->policy->policy_number,
            'title' => $title,
            'message' => $message,
            'type' => $this->noticeType,
            'channel' => $this->channel,
        ];
    }

    /**
     * SMS notification — logs locally; swap in a real SMS driver as needed.
     */
    public function toSms(object $notifiable): string
    {
        $expiryFormatted = $this->policy->expiry_date
            ? \Carbon\Carbon::parse($this->policy->expiry_date)->format('M d, Y')
            : 'N/A';

        $tenantName = $this->policy->tenant?->company_name ?? config('app.name');

        $message = $this->noticeType === 'expired'
            ? "[{$tenantName}] Your policy {$this->policy->policy_number} expired on {$expiryFormatted}. Please renew now."
            : "[{$tenantName}] Your policy {$this->policy->policy_number} expires on {$expiryFormatted}. Renew to avoid a lapse.";

        \Illuminate\Support\Facades\Log::info(
            "[SMS RENEWAL NOTICE] To: {$notifiable->phone} | {$message}"
        );

        return $message;
    }
}
