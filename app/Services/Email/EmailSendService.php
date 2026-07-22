<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use App\Services\Mail\TenantEmailService;

class EmailSendService
{
    public function __construct(
        private TenantEmailService $tenantEmail,
    ) {}

    /**
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    public function send(
        EmailAccount $account,
        string $to,
        string $subject,
        string $body,
        ?string $htmlBody = null,
        array $attachments = [],
        ?string $cc = null,
        ?string $bcc = null,
    ): array {
        return $this->tenantEmail->send($account, $to, $subject, $body, $htmlBody, $attachments, $cc, $bcc);
    }

    /**
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    public function reply(EmailMessage $original, string $body, bool $replyAll = false, array $attachments = []): array
    {
        $recipients = [$original->from_address];

        if ($replyAll && $original->cc_recipients) {
            $recipients = array_merge($recipients, $original->cc_recipients);
        }

        $subject = 'Re: '.$original->subject;
        $htmlBody = "<p>{$body}</p><hr><blockquote>{$original->body_html}</blockquote>";

        return $this->send($original->account, implode(',', $recipients), $subject, $body, $htmlBody, $attachments);
    }

    /**
     * @param  string[]  $to
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    public function forward(EmailMessage $original, string $body, array $to, array $attachments = []): array
    {
        $subject = 'Fwd: '.$original->subject;

        return $this->send($original->account, implode(',', $to), $subject, $body, $original->body_html, $attachments);
    }
}
