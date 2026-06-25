<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimStatusUpdated extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public Claim $claim,
        public string $oldStatus,
        public string $newStatus
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
            ->subject('Claim Status Updated')
            ->greeting('Hello!')
            ->line('The status of your claim has been updated.')
            ->line('Policy: '.$this->claim->policy->policy_number)
            ->line('Previous Status: '.ucfirst($this->oldStatus))
            ->line('New Status: '.ucfirst($this->newStatus))
            ->line('Claim Amount: $'.number_format($this->claim->amount, 2))
            ->action('View Claim', route('claims.show', $this->claim))
            ->line('Thank you for using our application!');

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
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
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
            'type' => 'claim_status_updated',
            'title' => 'Claim Status Updated',
            'message' => 'Your claim status has been updated from '.ucfirst($this->oldStatus).' to '.ucfirst($this->newStatus),
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
