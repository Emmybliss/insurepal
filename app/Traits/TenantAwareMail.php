<?php

namespace App\Traits;

use App\Models\EmailAccount;
use App\Models\Tenant;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Crypt;

trait TenantAwareMail
{
    protected function configureTenantMail(MailMessage|Mailable $mail, Tenant $tenant): MailMessage|Mailable
    {
        $senderName = $tenant->company_name ?? $tenant->name;

        $replyToEmail = $tenant->contact_email ?? $tenant->email;
        $replyToName = $senderName;

        $systemAccount = EmailAccount::where('tenant_id', $tenant->id)
            ->where('is_system_default', true)
            ->where('is_active', true)
            ->first();

        if ($systemAccount && $systemAccount->smtp_host) {
            $password = $systemAccount->credentials_encrypted
                ? Crypt::decryptString($systemAccount->credentials_encrypted)
                : null;

            $senderEmail = $systemAccount->email;

            config([
                'mail.mailers.smtp.host' => $systemAccount->smtp_host,
                'mail.mailers.smtp.port' => $systemAccount->smtp_port ?? 587,
                'mail.mailers.smtp.encryption' => $systemAccount->smtp_port === 465 ? 'ssl' : 'tls',
                'mail.mailers.smtp.username' => $systemAccount->email,
                'mail.mailers.smtp.password' => $password ?? '',
                'mail.from.address' => $senderEmail,
                'mail.from.name' => $senderName,
                'mail.default' => 'smtp',
            ]);

            \Illuminate\Support\Facades\Mail::purge('smtp');

            if ($mail instanceof MailMessage || $mail instanceof Mailable) {
                $mail->mailer('smtp');
            }
        } else {
            $senderEmail = config('mail.from.address');
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
