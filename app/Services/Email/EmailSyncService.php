<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Models\EmailAttachment;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use App\Services\Mail\TenantEmailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailSyncService
{
    public function __construct(
        private TenantEmailService $tenantEmail,
    ) {}

    public function syncAccount(EmailAccount $account): array
    {
        $stats = [
            'folders_synced' => 0,
            'messages_synced' => 0,
            'errors' => [],
        ];

        try {
            $folders = $this->fetchFolders($account);

            foreach ($folders as $folderData) {
                $folder = EmailFolder::updateOrCreate(
                    [
                        'account_id' => $account->id,
                        'remote_id' => $folderData['remote_id'],
                    ],
                    $folderData,
                );

                $stats['folders_synced']++;

                $messages = $this->fetchMessages($account, $folder);
                $stats['messages_synced'] += count($messages);
            }

            $account->update(['last_sync_at' => now()]);
        } catch (\Exception $e) {
            Log::error('Email sync failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            $stats['errors'][] = $e->getMessage();
        }

        return $stats;
    }

    public function syncFolder(EmailFolder $folder): array
    {
        $messages = $this->fetchMessages($folder->account, $folder);

        return [
            'messages_synced' => count($messages),
        ];
    }

    public function syncMessage(EmailMessage $message): void
    {
        $message->touch();
    }

    public function fullSync(EmailAccount $account): array
    {
        return $this->syncAccount($account);
    }

    public function fetchFolders(EmailAccount $account): array
    {
        return match ($account->provider) {
            'gmail' => $this->fetchGmailFolders($account),
            'microsoft365' => $this->fetchMicrosoftFolders($account),
            default => $this->fetchImapFolders($account),
        };
    }

    private function fetchGmailFolders(EmailAccount $account): array
    {
        return [
            ['name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox'],
            ['name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent'],
            ['name' => 'Drafts', 'remote_id' => 'DRAFT', 'type' => 'drafts'],
            ['name' => 'Trash', 'remote_id' => 'TRASH', 'type' => 'trash'],
            ['name' => 'Spam', 'remote_id' => 'SPAM', 'type' => 'spam'],
        ];
    }

    private function fetchMicrosoftFolders(EmailAccount $account): array
    {
        return [
            ['name' => 'Inbox', 'remote_id' => 'inbox', 'type' => 'inbox'],
            ['name' => 'Sent Items', 'remote_id' => 'sentitems', 'type' => 'sent'],
            ['name' => 'Drafts', 'remote_id' => 'drafts', 'type' => 'drafts'],
            ['name' => 'Deleted Items', 'remote_id' => 'deleteditems', 'type' => 'trash'],
        ];
    }

    private function fetchImapFolders(EmailAccount $account): array
    {
        return [
            ['name' => 'INBOX', 'remote_id' => 'INBOX', 'type' => 'inbox'],
            ['name' => 'Sent', 'remote_id' => 'Sent', 'type' => 'sent'],
            ['name' => 'Trash', 'remote_id' => 'Trash', 'type' => 'trash'],
        ];
    }

    private function fetchMessages(EmailAccount $account, EmailFolder $folder): array
    {
        if ($account->isTokenExpired()) {
            $this->tenantEmail->refreshToken($account);
        }

        return match ($account->provider) {
            'gmail' => $this->fetchGmailMessages($account, $folder),
            'microsoft365' => $this->fetchMicrosoftMessages($account, $folder),
            default => $this->fetchImapMessages($account, $folder),
        };
    }

    private function fetchGmailMessages(EmailAccount $account, EmailFolder $folder): array
    {
        $accessToken = Crypt::decryptString($account->oauth_token_encrypted);

        $response = Http::withToken($accessToken)
            ->get('https://gmail.googleapis.com/gmail/v1/users/me/messages', [
                'labelIds' => $folder->remote_id,
                'maxResults' => 50,
            ]);

        if ($response->failed() || ! $response->json('messages')) {
            return [];
        }

        $synced = [];

        foreach ($response->json('messages', []) as $item) {
            try {
                $msgResponse = Http::withToken($accessToken)
                    ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$item['id']}", [
                        'format' => 'full',
                    ]);

                if ($msgResponse->failed()) {
                    continue;
                }

                $data = $msgResponse->json();

                $parsed = $this->parseGmailPayload($data);

                $message = EmailMessage::updateOrCreate(
                    [
                        'account_id' => $account->id,
                        'message_id_remote' => $item['id'],
                    ],
                    array_merge($parsed, [
                        'account_id' => $account->id,
                        'folder_id' => $folder->id,
                        'message_id_remote' => $item['id'],
                        'thread_id' => $data['threadId'] ?? null,
                        'is_read' => ! in_array('UNREAD', $data['labelIds'] ?? []),
                        'is_flagged' => in_array('STARRED', $data['labelIds'] ?? []),
                        'size' => $data['sizeEstimate'] ?? 0,
                    ]),
                );

                $this->processGmailAttachments($message, $data['payload'] ?? [], $accessToken);

                $synced[] = $message;
            } catch (\Exception $e) {
                Log::warning('Failed to sync Gmail message', [
                    'message_id' => $item['id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $synced;
    }

    private function parseGmailPayload(array $data): array
    {
        $payload = $data['payload'] ?? [];
        $headers = collect($payload['headers'] ?? [])->keyBy('name');

        $bodyHtml = null;
        $bodyText = null;
        $this->extractGmailBody($payload, $bodyHtml, $bodyText);

        return [
            'subject' => $headers->get('Subject')['value'] ?? null,
            'from_address' => $this->extractEmail($headers->get('From')['value'] ?? ''),
            'from_name' => $this->extractName($headers->get('From')['value'] ?? ''),
            'to_recipients' => $this->extractAddresses($headers->get('To')['value'] ?? ''),
            'cc_recipients' => $headers->has('Cc') ? $this->extractAddresses($headers->get('Cc')['value']) : null,
            'bcc_recipients' => $headers->has('Bcc') ? $this->extractAddresses($headers->get('Bcc')['value']) : null,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText,
            'received_at' => $headers->has('Date') ? Carbon::parse($headers->get('Date')['value']) : null,
            'in_reply_to' => $headers->get('In-Reply-To')['value'] ?? $headers->get('References')['value'] ?? null,
        ];
    }

    private function extractGmailBody(array $payload, ?string &$bodyHtml, ?string &$bodyText): void
    {
        $mimeType = $payload['mimeType'] ?? '';

        if ($mimeType === 'text/html' && isset($payload['body']['data'])) {
            $bodyHtml = $this->base64urlDecode($payload['body']['data']);
        } elseif ($mimeType === 'text/plain' && isset($payload['body']['data'])) {
            $bodyText = $this->base64urlDecode($payload['body']['data']);
        }

        if (isset($payload['parts'])) {
            foreach ($payload['parts'] as $part) {
                $partMime = $part['mimeType'] ?? '';

                if ($partMime === 'text/html' && isset($part['body']['data'])) {
                    $bodyHtml = $this->base64urlDecode($part['body']['data']);
                } elseif ($partMime === 'text/plain' && isset($part['body']['data'])) {
                    $bodyText = $this->base64urlDecode($part['body']['data']);
                }

                if (isset($part['parts'])) {
                    $this->extractGmailBody($part, $bodyHtml, $bodyText);
                }
            }
        }
    }

    private function base64urlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($data, ['-' => '+', '_' => '/']));
    }

    private function processGmailAttachments(EmailMessage $message, array $payload, string $accessToken): void
    {
        if (isset($payload['parts'])) {
            foreach ($payload['parts'] as $part) {
                if (! empty($part['filename']) && isset($part['body']['attachmentId'])) {
                    $attachmentResponse = Http::withToken($accessToken)
                        ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$message->message_id_remote}/attachments/{$part['body']['attachmentId']}");

                    if ($attachmentResponse->ok()) {
                        $attachmentData = $attachmentResponse->json();
                        $decoded = $this->base64urlDecode($attachmentData['data'] ?? '');

                        $path = "email-attachments/{$message->id}/{$part['filename']}";
                        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $decoded);

                        EmailAttachment::create([
                            'message_id' => $message->id,
                            'filename' => $part['filename'],
                            'mime_type' => $part['mimeType'] ?? 'application/octet-stream',
                            'size_bytes' => $part['body']['size'] ?? strlen($decoded),
                            'storage_path' => $path,
                            'content_id' => $part['headers'] ?? null ? collect($part['headers'])->firstWhere('name', 'Content-ID')['value'] ?? null : null,
                        ]);
                    }
                }

                if (isset($part['parts'])) {
                    $this->processGmailAttachments($message, $part, $accessToken);
                }
            }
        }
    }

    private function fetchMicrosoftMessages(EmailAccount $account, EmailFolder $folder): array
    {
        $accessToken = Crypt::decryptString($account->oauth_token_encrypted);

        $response = Http::withToken($accessToken)
            ->get("https://graph.microsoft.com/v1.0/me/mailFolders/{$folder->remote_id}/messages", [
                '$top' => 50,
                '$orderby' => 'receivedDateTime desc',
            ]);

        if ($response->failed()) {
            Log::warning('Microsoft Graph fetch failed', ['error' => $response->body()]);

            return [];
        }

        $synced = [];

        foreach ($response->json('value', []) as $item) {
            try {
                $from = $item['from']['emailAddress'] ?? [];

                $to = collect($item['toRecipients'] ?? [])
                    ->pluck('emailAddress.address')
                    ->filter()
                    ->values()
                    ->toArray();

                $cc = collect($item['ccRecipients'] ?? [])
                    ->pluck('emailAddress.address')
                    ->filter()
                    ->values()
                    ->toArray();

                $bodyHtml = null;
                $bodyText = null;

                if (isset($item['body']['contentType'])) {
                    if ($item['body']['contentType'] === 'html') {
                        $bodyHtml = $item['body']['content'];
                    } else {
                        $bodyText = $item['body']['content'];
                    }
                }

                $message = EmailMessage::updateOrCreate(
                    [
                        'account_id' => $account->id,
                        'message_id_remote' => $item['id'],
                    ],
                    [
                        'account_id' => $account->id,
                        'folder_id' => $folder->id,
                        'message_id_remote' => $item['id'],
                        'thread_id' => $item['conversationId'] ?? null,
                        'subject' => $item['subject'] ?? null,
                        'body_html' => $bodyHtml,
                        'body_text' => $bodyText,
                        'from_address' => $from['address'] ?? '',
                        'from_name' => $from['name'] ?? null,
                        'to_recipients' => $to,
                        'cc_recipients' => $cc ?: null,
                        'received_at' => isset($item['receivedDateTime']) ? Carbon::parse($item['receivedDateTime']) : null,
                        'is_read' => $item['isRead'] ?? false,
                        'is_flagged' => isset($item['flag']['flagStatus']) && $item['flag']['flagStatus'] === 'flagged',
                        'size' => $item['size'] ?? 0,
                        'in_reply_to' => $item['inReplyTo'] ?? null,
                    ]);

                if (! empty($item['hasAttachments'])) {
                    $this->fetchMicrosoftAttachments($message, $accessToken);
                }

                $synced[] = $message;
            } catch (\Exception $e) {
                Log::warning('Failed to sync Microsoft message', [
                    'id' => $item['id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $synced;
    }

    private function fetchMicrosoftAttachments(EmailMessage $message, string $accessToken): void
    {
        $response = Http::withToken($accessToken)
            ->get("https://graph.microsoft.com/v1.0/me/messages/{$message->message_id_remote}/attachments");

        if ($response->failed()) {
            return;
        }

        foreach ($response->json('value', []) as $attachment) {
            if (($attachment['@odata.type'] ?? '') === '#microsoft.graph.fileAttachment') {
                $decoded = base64_decode($attachment['contentBytes'] ?? '');
                $path = "email-attachments/{$message->id}/{$attachment['name']}";
                \Illuminate\Support\Facades\Storage::disk('local')->put($path, $decoded);

                EmailAttachment::create([
                    'message_id' => $message->id,
                    'filename' => $attachment['name'],
                    'mime_type' => $attachment['contentType'] ?? 'application/octet-stream',
                    'size_bytes' => $attachment['size'] ?? strlen($decoded),
                    'storage_path' => $path,
                ]);
            }
        }
    }

    private function fetchImapMessages(EmailAccount $account, EmailFolder $folder): array
    {
        if (! function_exists('imap_open')) {
            Log::warning('IMAP extension not available, skipping IMAP sync');

            return [];
        }

        $host = $account->imap_host;
        $port = $account->imap_port ?? 993;
        $encryption = $port === 993 ? '/ssl' : ($port === 143 ? '/tls/novalidate-cert' : '/novalidate-cert');
        $password = $account->credentials_encrypted
            ? Crypt::decryptString($account->credentials_encrypted)
            : null;

        if (! $host || ! $password) {
            return [];
        }

        $mailbox = "{{$host}:{$port}/imap{$encryption}}{$folder->remote_id}";

        $inbox = @imap_open($mailbox, $account->email, $password);
        if (! $inbox) {
            Log::error('IMAP connection failed', ['host' => $host, 'error' => imap_last_error()]);

            return [];
        }

        try {
            $emails = imap_search($inbox, 'ALL', SE_FREE);
            if (! $emails) {
                return [];
            }

            $emails = array_slice(array_reverse($emails), 0, 50);
            $synced = [];

            foreach ($emails as $msgNum) {
                try {
                    $header = imap_headerinfo($inbox, $msgNum);
                    $remoteId = $header->message_id ?? 'msg-'.$msgNum.'-'.($header->udate ?? time());

                    $existing = EmailMessage::where('account_id', $account->id)
                        ->where('message_id_remote', $remoteId)
                        ->first();

                    if ($existing) {
                        $synced[] = $existing;

                        continue;
                    }

                    $structure = imap_fetchstructure($inbox, $msgNum);

                    $bodyText = null;
                    $bodyHtml = null;
                    $this->extractImapBody($inbox, $msgNum, $structure, $bodyText, $bodyHtml);

                    $to = [];
                    if (isset($header->to)) {
                        foreach ($header->to as $addr) {
                            $to[] = $addr->mailbox.'@'.$addr->host;
                        }
                    }

                    $cc = null;
                    if (isset($header->cc)) {
                        $cc = [];
                        foreach ($header->cc as $addr) {
                            $cc[] = $addr->mailbox.'@'.$addr->host;
                        }
                    }

                    $fromAddress = ! empty($header->from[0])
                        ? ($header->from[0]->mailbox.'@'.$header->from[0]->host)
                        : '';
                    $fromName = $header->from[0]->personal ?? null;

                    $subject = $header->subject ?? null;
                    if ($subject !== null) {
                        $decoded = imap_mime_header_decode($subject);
                        $subject = implode('', array_map(fn ($p) => $p->text, $decoded));
                    }

                    $message = EmailMessage::create([
                        'account_id' => $account->id,
                        'folder_id' => $folder->id,
                        'message_id_remote' => $remoteId,
                        'subject' => $subject,
                        'body_html' => $bodyHtml,
                        'body_text' => $bodyText,
                        'from_address' => $fromAddress,
                        'from_name' => $fromName,
                        'to_recipients' => $to,
                        'cc_recipients' => $cc,
                        'received_at' => isset($header->udate) ? Carbon::createFromTimestamp($header->udate) : null,
                        'is_read' => ! ($header->unseen ?? false),
                        'is_flagged' => ($header->flagged ?? false),
                        'size' => $header->Size ?? 0,
                    ]);

                    $this->processImapAttachments($inbox, $msgNum, $message, $structure);

                    $synced[] = $message;
                } catch (\Exception $e) {
                    Log::warning('Failed to sync IMAP message', [
                        'msg_num' => $msgNum,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return $synced;
        } finally {
            imap_close($inbox);
        }
    }

    private function extractImapBody($inbox, int $msgNum, \stdClass $structure, ?string &$bodyText, ?string &$bodyHtml): void
    {
        if ($structure->type === 0) {
            $body = imap_fetchbody($inbox, $msgNum, 1);

            if (! empty($structure->encoding)) {
                $body = $this->decodeImapBody($body, $structure->encoding);
            }

            if ($structure->subtype === 'HTML') {
                $bodyHtml = $body;
            } else {
                $bodyText = $body;
            }
        } elseif ($structure->type === 1 && isset($structure->parts)) {
            foreach ($structure->parts as $partNum => $part) {
                $this->extractImapPartBody($inbox, $msgNum, $part, $partNum + 1, $bodyText, $bodyHtml);
            }
        }
    }

    private function extractImapPartBody($inbox, int $msgNum, \stdClass $part, int $partNum, ?string &$bodyText, ?string &$bodyHtml): void
    {
        if ($part->type === 0) {
            $body = imap_fetchbody($inbox, $msgNum, $partNum);

            if (! empty($part->encoding)) {
                $body = $this->decodeImapBody($body, $part->encoding);
            }

            $mimeType = strtolower($part->subtype ?? '');

            if ($mimeType === 'html' || $mimeType === 'plain') {
                if ($mimeType === 'html') {
                    $bodyHtml = $bodyHtml ? $bodyHtml.$body : $body;
                } else {
                    $bodyText = $bodyText ? $bodyText.$body : $body;
                }
            }
        } elseif ($part->type === 1 && isset($part->parts)) {
            $subPartNum = $partNum;
            foreach ($part->parts as $subPart) {
                $subPartNum++;
                $this->extractImapPartBody($inbox, $msgNum, $subPart, $subPartNum, $bodyText, $bodyHtml);
            }
        }
    }

    private function decodeImapBody(string $body, int $encoding): string
    {
        return match ($encoding) {
            1 => base64_decode($body),
            2 => quoted_printable_decode($body),
            3, 4, 5 => base64_decode($body),
            default => $body,
        };
    }

    private function processImapAttachments($inbox, int $msgNum, EmailMessage $message, \stdClass $structure): void
    {
        if (! isset($structure->parts)) {
            return;
        }

        $partNum = 1;

        foreach ($structure->parts as $part) {
            $partNum++;

            if (! empty($part->ifdparameters) && empty($part->type)) {
                continue;
            }

            if ($part->type === 0 && ! empty($part->dparameters)) {
                foreach ($part->dparameters as $param) {
                    if (strtolower($param->attribute) === 'filename') {
                        $body = imap_fetchbody($inbox, $msgNum, $partNum);

                        if (! empty($part->encoding)) {
                            $body = $this->decodeImapBody($body, $part->encoding);
                        }

                        $path = "email-attachments/{$message->id}/{$param->value}";
                        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $body);

                        EmailAttachment::create([
                            'message_id' => $message->id,
                            'filename' => $param->value,
                            'mime_type' => $part->subtype ?? 'application/octet-stream',
                            'size_bytes' => strlen($body),
                            'storage_path' => $path,
                        ]);

                        break;
                    }
                }
            }

            if (isset($part->parts)) {
                $subPartNum = $partNum;
                foreach ($part->parts as $subPart) {
                    $subPartNum++;
                    if (! empty($subPart->dparameters)) {
                        foreach ($subPart->dparameters as $param) {
                            if (strtolower($param->attribute) === 'filename') {
                                $body = imap_fetchbody($inbox, $msgNum, $subPartNum);

                                if (! empty($subPart->encoding)) {
                                    $body = $this->decodeImapBody($body, $subPart->encoding);
                                }

                                $path = "email-attachments/{$message->id}/{$param->value}";
                                \Illuminate\Support\Facades\Storage::disk('local')->put($path, $body);

                                EmailAttachment::create([
                                    'message_id' => $message->id,
                                    'filename' => $param->value,
                                    'mime_type' => $subPart->subtype ?? 'application/octet-stream',
                                    'size_bytes' => strlen($body),
                                    'storage_path' => $path,
                                ]);

                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    private function extractEmail(string $header): string
    {
        if (preg_match('/<([^>]+)>/', $header, $matches)) {
            return $matches[1];
        }

        return trim($header);
    }

    private function extractName(string $header): ?string
    {
        if (preg_match('/^([^<]+)</', $header, $matches)) {
            $name = trim($matches[1], '" ');

            return $name ?: null;
        }

        return null;
    }

    private function extractAddresses(string $header): array
    {
        $addresses = [];

        $parts = explode(',', $header);
        foreach ($parts as $part) {
            $part = trim($part);
            if (preg_match('/<([^>]+)>/', $part, $matches)) {
                $addresses[] = $matches[1];
            } elseif (filter_var($part, FILTER_VALIDATE_EMAIL)) {
                $addresses[] = $part;
            }
        }

        return $addresses;
    }
}
