<?php

namespace App\Notifications;

use App\Models\Policy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PolicyExpiryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $policy;

    public $stage;

    public $daysUntilExpiry;

    /**
     * Create a new notification instance.
     */
    public function __construct(Policy $policy, string $stage, int $daysUntilExpiry)
    {
        $this->policy = $policy;
        $this->stage = $stage;
        $this->daysUntilExpiry = $daysUntilExpiry;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Add 'database' if you want it to appear in DB notifications array.
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = 'Action Required: Your Policy is Expiring Soon';
        if ($this->daysUntilExpiry === 0) {
            $subject = 'URGENT: Your Policy Expires Today';
        }

        $message = (new MailMessage)
            ->subject($subject);

        $greetingName = $notifiable->first_name ?? $notifiable->company_name ?? 'Customer';
        $message->greeting('Hello '.$greetingName.',');

        $body = 'This is a reminder that your insurance policy (Policy No: '.$this->policy->policy_number.') ';

        if ($this->daysUntilExpiry === 0) {
            $body .= 'expires TODAY ('.$this->policy->expiry_date->format('M d, Y').').';
        } else {
            $body .= 'will expire in '.$this->daysUntilExpiry.' days on '.$this->policy->expiry_date->format('M d, Y').'.';
        }

        return $message
            ->line($body)
            ->line('Please review your account to renew the policy or contact support if you have any questions.')
            ->action('View Policy', url('/policies/'.$this->policy->id))
            ->line('Thank you for choosing InsurePal!');
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
            'stage' => $this->stage,
            'days_until_expiry' => $this->daysUntilExpiry,
            'message' => 'Policy '.$this->policy->policy_number.' expires in '.$this->daysUntilExpiry.' days.',
        ];
    }
}
