<?php

namespace App\Services\Email\Providers;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Contracts\EmailProviderInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GmailProvider implements EmailProviderInterface
{
    public function testConnection(EmailAccount $account): array
    {
        if ($account->isTokenExpired()) {
            $refreshed = $this->refreshToken($account);
            if (! $refreshed) {
                return ['success' => false, 'error' => 'Gmail OAuth token expired and refresh failed. Please re-authenticate.'];
            }
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return ['success' => false, 'error' => 'Gmail OAuth access token is missing. Please connect account via OAuth.'];
        }

        $res = Http::withToken($accessToken)->get('https://gmail.googleapis.com/gmail/v1/users/me/profile');
        if ($res->ok()) {
            return ['success' => true, 'error' => null];
        }

        return ['success' => false, 'error' => 'Gmail API error: '.$res->body()];
    }

    public function refreshToken(EmailAccount $account): bool
    {
        $refreshToken = $account->getDecryptedRefreshToken();
        if (! $refreshToken) {
            return false;
        }

        $clientId = config('email.oauth.gmail.client_id');
        $clientSecret = config('email.oauth.gmail.client_secret');

        if (! $clientId || ! $clientSecret) {
            Log::error('Gmail OAuth client_id or client_secret missing in configuration');

            return false;
        }

        try {
            $response = Http::post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $refreshToken,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->failed()) {
                Log::warning('Gmail OAuth token refresh failed', [
                    'account_id' => $account->id,
                    'response' => $response->body(),
                ]);

                return false;
            }

            $data = $response->json();
            $account->update([
                'oauth_token_encrypted' => \Illuminate\Support\Facades\Crypt::encryptString($data['access_token']),
                'token_expires_at' => now()->addSeconds($data['expires_in'] ?? 3600),
            ]);

            if (isset($data['refresh_token'])) {
                $account->update([
                    'refresh_token_encrypted' => \Illuminate\Support\Facades\Crypt::encryptString($data['refresh_token']),
                ]);
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Gmail token refresh exception', ['error' => $e->getMessage()]);

            return false;
        }
    }

    public function fetchFolders(EmailAccount $account): array
    {
        return [
            ['name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox'],
            ['name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent'],
            ['name' => 'Drafts', 'remote_id' => 'DRAFT', 'type' => 'drafts'],
            ['name' => 'Trash', 'remote_id' => 'TRASH', 'type' => 'trash'],
            ['name' => 'Spam', 'remote_id' => 'SPAM', 'type' => 'spam'],
        ];
    }

    public function fetchMessages(EmailAccount $account, EmailFolder $folder, ?string $cursor = null): array
    {
        if ($account->isTokenExpired()) {
            $this->refreshToken($account);
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return ['messages' => [], 'next_cursor' => $cursor];
        }

        $queryParams = [
            'labelIds' => $folder->remote_id,
            'maxResults' => 100,
        ];
        if ($cursor) {
            $queryParams['pageToken'] = $cursor;
        }

        $res = Http::withToken($accessToken)->get('https://gmail.googleapis.com/gmail/v1/users/me/messages', $queryParams);
        if ($res->failed() || ! $res->json('messages')) {
            return ['messages' => [], 'next_cursor' => null];
        }

        $nextPageToken = $res->json('nextPageToken');
        $messages = [];

        foreach ($res->json('messages', []) as $item) {
            try {
                $msgRes = Http::withToken($accessToken)
                    ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$item['id']}", ['format' => 'full']);

                if ($msgRes->failed()) {
                    continue;
                }

                $data = $msgRes->json();
                $parsed = $this->parseGmailPayload($data);

                $messages[] = array_merge($parsed, [
                    'message_id_remote' => $item['id'],
                    'thread_id' => $data['threadId'] ?? null,
                    'is_read' => ! in_array('UNREAD', $data['labelIds'] ?? []),
                    'is_flagged' => in_array('STARRED', $data['labelIds'] ?? []),
                    'size' => $data['sizeEstimate'] ?? 0,
                    'payload_raw' => $data,
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to parse Gmail message', ['id' => $item['id'], 'error' => $e->getMessage()]);
            }
        }

        return [
            'messages' => $messages,
            'next_cursor' => $nextPageToken,
        ];
    }

    public function sendMessage(EmailAccount $account, array $payload): array
    {
        if ($account->isTokenExpired()) {
            $this->refreshToken($account);
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return ['success' => false, 'message_id' => null, 'error' => 'No access token available.'];
        }

        $mimeMessage = empty($payload['attachments'])
            ? $this->buildSimpleMimeMessage($account->email, $payload['to'], $payload['subject'], $payload['body_html'] ?? $payload['body_text'], $payload['cc'] ?? null, $payload['bcc'] ?? null)
            : $this->buildMultipartMimeMessage($account->email, $payload['to'], $payload['subject'], $payload['body_html'] ?? $payload['body_text'], $payload['attachments'], $payload['cc'] ?? null, $payload['bcc'] ?? null);

        $response = Http::withToken($accessToken)
            ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw' => $mimeMessage,
            ]);

        if ($response->failed()) {
            return ['success' => false, 'message_id' => null, 'error' => 'Gmail API error: '.$response->body()];
        }

        return [
            'success' => true,
            'message_id' => $response->json('id'),
            'error' => null,
        ];
    }

    private function parseGmailPayload(array $data): array
    {
        $payload = $data['payload'] ?? [];
        $headers = collect($payload['headers'] ?? [])->keyBy(fn ($h) => strtolower($h['name']));

        $bodyHtml = null;
        $bodyText = null;
        $this->extractGmailBody($payload, $bodyHtml, $bodyText);

        $fromRaw = $headers->get('from')['value'] ?? '';
        $messageIdHeader = $headers->get('message-id')['value'] ?? null;
        $inReplyTo = $headers->get('in-reply-to')['value'] ?? null;
        $referencesRaw = $headers->get('references')['value'] ?? null;
        $references = $referencesRaw ? array_map('trim', explode(' ', $referencesRaw)) : null;

        return [
            'message_id_header' => $messageIdHeader,
            'subject' => $headers->get('subject')['value'] ?? null,
            'from_address' => $this->extractEmail($fromRaw),
            'from_name' => $this->extractName($fromRaw),
            'to_recipients' => $this->extractAddresses($headers->get('to')['value'] ?? ''),
            'cc_recipients' => $headers->has('cc') ? $this->extractAddresses($headers->get('cc')['value']) : null,
            'bcc_recipients' => $headers->has('bcc') ? $this->extractAddresses($headers->get('bcc')['value']) : null,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText,
            'received_at' => $headers->has('date') ? Carbon::parse($headers->get('date')['value']) : now(),
            'in_reply_to' => $inReplyTo,
            'references' => $references,
        ];
    }

    private function extractGmailBody(array $payload, ?string &$bodyHtml, ?string &$bodyText): void
    {
        $mimeType = strtolower($payload['mimeType'] ?? '');

        if ($mimeType === 'text/html' && isset($payload['body']['data'])) {
            $bodyHtml = $this->base64urlDecode($payload['body']['data']);
        } elseif ($mimeType === 'text/plain' && isset($payload['body']['data'])) {
            $bodyText = $this->base64urlDecode($payload['body']['data']);
        }

        if (isset($payload['parts'])) {
            foreach ($payload['parts'] as $part) {
                $partMime = strtolower($part['mimeType'] ?? '');
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

    private function buildSimpleMimeMessage(string $from, string $to, string $subject, string $body, ?string $cc = null, ?string $bcc = null): string
    {
        $headers = [];
        $headers[] = "From: {$from}";
        $headers[] = "To: {$to}";
        if ($cc) {
            $headers[] = "Cc: {$cc}";
        }
        if ($bcc) {
            $headers[] = "Bcc: {$bcc}";
        }
        $headers[] = 'Subject: =?UTF-8?B?'.base64_encode($subject).'?=';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';

        $message = implode("\r\n", $headers)."\r\n\r\n".chunk_split(base64_encode($body));

        return rtrim(strtr(base64_encode($message), ['+' => '-', '/' => '_']), '=');
    }

    private function buildMultipartMimeMessage(string $from, string $to, string $subject, string $body, array $attachments, ?string $cc = null, ?string $bcc = null): string
    {
        $boundary = 'boundary_'.uniqid();
        $raw = '';
        $raw .= "From: {$from}\r\nTo: {$to}\r\n";
        if ($cc) {
            $raw .= "Cc: {$cc}\r\n";
        }
        if ($bcc) {
            $raw .= "Bcc: {$bcc}\r\n";
        }
        $raw .= 'Subject: =?UTF-8?B?'.base64_encode($subject)."?=\r\n";
        $raw .= "MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";

        $raw .= "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
        $raw .= chunk_split(base64_encode($body))."\r\n";

        foreach ($attachments as $att) {
            $disk = $att['disk'] ?? 'local';
            if (\Illuminate\Support\Facades\Storage::disk($disk)->exists($att['path'])) {
                $fileContent = \Illuminate\Support\Facades\Storage::disk($disk)->get($att['path']);
                $encoded = chunk_split(base64_encode($fileContent));
                $safeName = addslashes($att['name']);

                $raw .= "--{$boundary}\r\n";
                $raw .= "Content-Type: {$att['mime']}; name=\"{$safeName}\"\r\n";
                $raw .= "Content-Transfer-Encoding: base64\r\n";
                $raw .= "Content-Disposition: attachment; filename=\"{$safeName}\"\r\n\r\n";
                $raw .= $encoded."\r\n";
            }
        }
        $raw .= "--{$boundary}--";

        return rtrim(strtr(base64_encode($raw), ['+' => '-', '/' => '_']), '=');
    }
}
