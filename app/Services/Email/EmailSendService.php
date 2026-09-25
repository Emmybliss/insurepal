<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use Illuminate\Support\Facades\Log;

class EmailSendService
{
    public function __construct(
        private EmailProviderFactory $providerFactory,
        private EmailThreadingService $threadingService,
        private EmailEntityMatcherService $entityMatcher,
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
        ?string $inReplyTo = null,
        ?array $references = null,
    ): array {
        try {
            $provider = $this->providerFactory->make($account);

            $payload = [
                'to' => $to,
                'subject' => $subject,
                'body_text' => $body,
                'body_html' => $htmlBody ?: nl2br(e($body)),
                'cc' => $cc,
                'bcc' => $bcc,
                'attachments' => $attachments,
            ];

            $result = $provider->sendMessage($account, $payload);

            if ($result['success']) {
                $toRecipients = array_map('trim', explode(',', $to));
                $ccRecipients = $cc ? array_map('trim', explode(',', $cc)) : null;
                $bccRecipients = $bcc ? array_map('trim', explode(',', $bcc)) : null;

                $sentFolder = $account->sent() ?? $account->folders()->firstOrCreate(
                    ['type' => 'sent'],
                    ['name' => 'Sent', 'remote_id' => 'Sent']
                );

                $sentMessage = EmailMessage::create([
                    'account_id' => $account->id,
                    'folder_id' => $sentFolder->id,
                    'message_id_remote' => $result['message_id'],
                    'message_id_header' => $result['message_id'],
                    'subject' => $subject,
                    'body_text' => $body,
                    'body_html' => $htmlBody ?: nl2br(e($body)),
                    'from_address' => $account->email,
                    'from_name' => $account->account_name ?: $account->email,
                    'to_recipients' => $toRecipients,
                    'cc_recipients' => $ccRecipients,
                    'bcc_recipients' => $bccRecipients,
                    'received_at' => now(),
                    'is_read' => true,
                    'is_draft' => false,
                    'in_reply_to' => $inReplyTo,
                    'references' => $references,
                ]);

                // Attach to thread and link entities
                $thread = $this->threadingService->resolveThreadForMessage($account, [
                    'subject' => $subject,
                    'from_address' => $account->email,
                    'to_recipients' => $toRecipients,
                    'cc_recipients' => $ccRecipients,
                    'received_at' => now(),
                    'in_reply_to' => $inReplyTo,
                    'references' => $references,
                ], $sentMessage);

                $this->entityMatcher->matchAndLinkEntities($sentMessage, $thread);
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('EmailSendService send failed', [
                'account_id' => $account->id,
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
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

        $subject = str_starts_with(strtolower($original->subject ?? ''), 're:')
            ? $original->subject
            : 'Re: '.$original->subject;

        $htmlBody = '<p>'.nl2br(e($body))."</p><hr><blockquote style='border-left: 2px solid #ccc; padding-left: 10px; color: #666;'>{$original->body_html}</blockquote>";

        $inReplyTo = $original->message_id_header ?: $original->message_id_remote;
        $references = array_merge($original->references ?? [], array_filter([$inReplyTo]));

        return $this->send(
            $original->account,
            implode(',', array_unique($recipients)),
            $subject,
            $body,
            $htmlBody,
            $attachments,
            null,
            null,
            $inReplyTo,
            $references
        );
    }

    /**
     * @param  string[]  $to
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    public function forward(EmailMessage $original, string $body, array $to, array $attachments = []): array
    {
        $subject = str_starts_with(strtolower($original->subject ?? ''), 'fwd:')
            ? $original->subject
            : 'Fwd: '.$original->subject;

        $htmlBody = '<p>'.nl2br(e($body))."</p><hr><blockquote style='border-left: 2px solid #ccc; padding-left: 10px; color: #666;'>{$original->body_html}</blockquote>";

        return $this->send(
            $original->account,
            implode(',', $to),
            $subject,
            $body,
            $htmlBody,
            $attachments
        );
    }
}
