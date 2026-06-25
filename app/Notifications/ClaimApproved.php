<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimApproved extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public Claim $claim,
        public float $approvedAmount
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mailMessage = (new MailMessage)
            ->subject('Claim Approved')
            ->greeting('Congratulations!')
            ->line('Your claim has been approved.')
            ->line('Policy: '.$this->claim->policy->policy_number)
            ->line('Claim Amount: $'.number_format($this->claim->amount, 2))
            ->line('Approved Amount: $'.number_format($this->approvedAmount, 2))
            ->action('View Claim', route('claims.show', $this->claim))
            ->line('Payment will be processed within 5-7 business days.');

        return collect([$mailMessage])->pipe(function ($collection) {
            $mail = $collection->first();

            return $this->configureTenantMail($mail, $this->claim->policy->tenant);
        });
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'claim_id' => $this->claim->id,
            'claim_type' => $this->claim->claim_type,
            'amount' => $this->claim->amount,
            'approved_amount' => $this->approvedAmount,
            'policy_number' => $this->claim->policy->policy_number,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'id' => $this->id,
            'type' => 'claim_approved',
            'title' => 'Claim Approved',
            'message' => 'Your claim has been approved for $'.number_format($this->approvedAmount, 2),
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
