<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends \Illuminate\Auth\Notifications\VerifyEmail implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        $tenant = $notifiable->tenant;

        $mailMessage = (new MailMessage)
            ->subject('Verify Email Address')
            ->markdown('emails.verify-email', [
                'actionUrl' => $verificationUrl,
                'tenant' => $tenant,
            ]);

        // Apply SMTP switching + from/replyTo branding
        if ($tenant) {
            $this->configureTenantMail($mailMessage, $tenant);
        }

        return $mailMessage;
    }
}
