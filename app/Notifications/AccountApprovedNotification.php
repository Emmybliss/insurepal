<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountApprovedNotification extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public ?User $approver = null
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $tenant = $notifiable->tenant;

        $mailMessage = (new MailMessage)
            ->subject('Account Approved - '.config('app.name'))
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your account has been manually approved by an administrator.')
            ->line('You now have full access to your organization dashboard and workspace.')
            ->action('Log In & Access Workspace', route('login'))
            ->line('If you have any questions, please reach out to your administrator.');

        if ($tenant) {
            $this->configureTenantMail($mailMessage, $tenant);
        }

        return $mailMessage;
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'account_approved',
            'title' => 'Account Approved',
            'message' => 'Your account has been manually approved by an administrator.',
            'url' => route('dashboard'),
        ];
    }
}
