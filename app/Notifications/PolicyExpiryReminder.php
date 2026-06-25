<?php

namespace App\Notifications;

use App\Models\Policy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PolicyExpiryReminder extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public Policy $policy,
        public int $daysUntilExpiry
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
        $message = (new MailMessage)
            ->subject('Policy Expiry Reminder')
            ->greeting('Hello!')
            ->line('Your policy is expiring soon.')
            ->line('Policy Number: '.$this->policy->policy_number)
            ->line('Expiry Date: '.$this->policy->end_date->format('M d, Y'));

        if ($this->daysUntilExpiry <= 7) {
            $message->line('⚠️ Your policy expires in '.$this->daysUntilExpiry.' days!');
        } else {
            $message->line('Your policy expires in '.$this->daysUntilExpiry.' days.');
        }

        $message->action('Renew Policy', route('policies.renew', $this->policy))
            ->line('Please contact us to renew your policy before the expiry date.');

        return collect([$message])->pipe(function ($collection) {
            $mail = $collection->first();

            return $this->configureTenantMail($mail, $this->policy->tenant);
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
            'policy_id' => $this->policy->id,
            'policy_number' => $this->policy->policy_number,
            'expiry_date' => $this->policy->end_date->toISOString(),
            'days_until_expiry' => $this->daysUntilExpiry,
            'customer_name' => $this->policy->customer->first_name.' '.$this->policy->customer->last_name,
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
            'type' => 'policy_expiry_reminder',
            'title' => 'Policy Expiry Reminder',
            'message' => 'Your policy '.$this->policy->policy_number.' expires in '.$this->daysUntilExpiry.' days',
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
