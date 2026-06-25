<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdditionalInfoRequested extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Claim $claim,
        public string $requestedInfo
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
        return (new MailMessage)
            ->subject('Additional Information Required')
            ->greeting('Hello!')
            ->line('We need additional information to process your claim.')
            ->line('Policy: '.$this->claim->policy->policy_number)
            ->line('Claim Amount: $'.number_format($this->claim->amount, 2))
            ->line('Required Information: '.$this->requestedInfo)
            ->action('View Claim', route('claims.show', $this->claim))
            ->line('Please provide the requested information to continue processing your claim.');
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
            'requested_info' => $this->requestedInfo,
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
            'type' => 'additional_info_requested',
            'title' => 'Additional Information Required',
            'message' => 'We need additional information to process your claim: '.$this->requestedInfo,
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
