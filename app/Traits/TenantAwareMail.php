<?php

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Messages\MailMessage;

trait TenantAwareMail
{
    /**
     * Configure the mail message or mailable with tenant branding and sender info.
     */
    protected function configureTenantMail(MailMessage|Mailable $mail, Tenant $tenant): MailMessage|Mailable
    {
        $senderName = $tenant->company_name ?? $tenant->name;

        $replyToEmail = $tenant->contact_email ?? $tenant->email;
        $replyToName = $senderName;

        // Try to load custom SMTP settings
        $smtp = $tenant->smtp_settings;
        if (! empty($smtp) && ! empty($smtp['use_custom'])) {
            // Some SMTP providers (like Mailtrap or SendGrid) use non-email usernames.
            // If the username is a valid email, we can use it, otherwise fallback to the tenant's actual email.
            $senderEmail = ! empty($smtp['from_address']) ? $smtp['from_address'] :
                           (filter_var($smtp['username'] ?? '', FILTER_VALIDATE_EMAIL) ? $smtp['username'] : ($tenant->contact_email ?? $tenant->email));

            // Temporarily set configuration for the 'smtp' mailer so it picks up the custom one
            // In a queued job, this config change will be isolated to this specific job's execution
            config([
                'mail.mailers.smtp.host' => $smtp['host'] ?? '',
                'mail.mailers.smtp.port' => $smtp['port'] ?? 587,
                'mail.mailers.smtp.encryption' => $smtp['encryption'] ?? 'tls',
                'mail.mailers.smtp.username' => $smtp['username'] ?? '',
                'mail.mailers.smtp.password' => $smtp['password'] ?? '',
                'mail.from.address' => $senderEmail,
                'mail.from.name' => $senderName,
                'mail.default' => 'smtp',
            ]);

            // Force Laravel to re-resolve the SMTP mailer so it picks up the new config
            \Illuminate\Support\Facades\Mail::purge('smtp');

            // For MailMessage/Mailable, explicitly set the mailer
            if ($mail instanceof MailMessage || $mail instanceof Mailable) {
                $mail->mailer('smtp');
            }
        } else {
            // Fallback to system default
            $senderEmail = config('mail.from.address');
            // Purge the mailer in case a previous job ran with custom creds
            \Illuminate\Support\Facades\Mail::purge('smtp');
        }

        if ($mail instanceof MailMessage) {
            $mail->from($senderEmail, $senderName)
                ->replyTo($replyToEmail, $replyToName);
            $mail->viewData['tenant'] = $tenant;
        } elseif ($mail instanceof Mailable) {
            $mail->from($senderEmail, $senderName)
                ->replyTo($replyToEmail, $replyToName)
                ->with(['tenant' => $tenant]);
        }

        return $mail;
    }
}
