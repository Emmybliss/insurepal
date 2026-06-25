<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimSubmitted extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public Claim $claim
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
            ->subject('New Claim Submitted')
            ->greeting('Hello!')
            ->line('A new claim has been submitted for policy: '.$this->claim->policy->policy_number)
            ->line('Claim Amount: $'.number_format($this->claim->amount, 2))
            ->line('Claim Type: '.$this->claim->claim_type)
            ->action('View Claim', route('claims.show', $this->claim))
            ->line('Please review the claim details and take appropriate action.');

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
            'policy_number' => $this->claim->policy->policy_number,
            'submitted_by' => $this->claim->customer->first_name.' '.$this->claim->customer->last_name,
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
            'type' => 'claim_submitted',
            'title' => 'New Claim Submitted',
            'message' => 'A new claim has been submitted for policy: '.$this->claim->policy->policy_number,
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
