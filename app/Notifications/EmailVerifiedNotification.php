<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerifiedNotification extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $tenant = $notifiable->tenant;

        $mailMessage = (new MailMessage)
            ->subject('Email Address Verified - '.config('app.name'))
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your email address has been successfully verified.')
            ->line('Your account is now active and ready for use.')
            ->action('Access Dashboard', route('dashboard'))
            ->line('Thank you for using '.config('app.name').'!');

        if ($tenant) {
            $this->configureTenantMail($mailMessage, $tenant);
        }

        return $mailMessage;
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'email_verified',
            'title' => 'Email Verified',
            'message' => 'Your email address has been verified successfully.',
            'url' => route('dashboard'),
        ];
    }
}
