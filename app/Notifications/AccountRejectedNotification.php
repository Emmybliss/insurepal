<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountRejectedNotification extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public ?string $reason = null
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $tenant = $notifiable->tenant;

        $mailMessage = (new MailMessage)
            ->subject('Account Registration Status - '.config('app.name'))
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your account registration request has been reviewed.')
            ->line('Unfortunately, your registration request could not be approved at this time.');

        if ($this->reason) {
            $mailMessage->line('Reason provided: '.$this->reason);
        }

        $mailMessage->line('If you believe this is an error, please contact system support.');

        if ($tenant) {
            $this->configureTenantMail($mailMessage, $tenant);
        }

        return $mailMessage;
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'account_rejected',
            'title' => 'Account Registration Rejected',
            'message' => 'Your account registration request was not approved.'.($this->reason ? " Reason: {$this->reason}" : ''),
            'url' => route('login'),
        ];
    }
}
