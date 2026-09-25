<?php

namespace App\Services\Email\Providers;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Contracts\EmailProviderInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MicrosoftGraphProvider implements EmailProviderInterface
{
    public function testConnection(EmailAccount $account): array
    {
        if ($account->isTokenExpired()) {
            $refreshed = $this->refreshToken($account);
            if (! $refreshed) {
                return ['success' => false, 'error' => 'Microsoft OAuth token expired and refresh failed. Please re-authenticate.'];
            }
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return ['success' => false, 'error' => 'Microsoft OAuth access token is missing. Please connect account via OAuth.'];
        }

        $res = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me');
        if ($res->ok()) {
            return ['success' => true, 'error' => null];
        }

        return ['success' => false, 'error' => 'Microsoft Graph API error: '.$res->body()];
    }

    public function refreshToken(EmailAccount $account): bool
    {
        $refreshToken = $account->getDecryptedRefreshToken();
        if (! $refreshToken) {
            return false;
        }

        $clientId = config('email.oauth.microsoft365.client_id');
        $clientSecret = config('email.oauth.microsoft365.client_secret');

        if (! $clientId || ! $clientSecret) {
            Log::error('Microsoft OAuth client_id or client_secret missing in configuration');

            return false;
        }

        try {
            $response = Http::post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $refreshToken,
                'grant_type' => 'refresh_token',
                'scope' => 'User.Read Mail.ReadWrite Mail.Send offline_access',
            ]);

            if ($response->failed()) {
                Log::warning('Microsoft OAuth token refresh failed', [
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
            Log::error('Microsoft token refresh exception', ['error' => $e->getMessage()]);

            return false;
        }
    }

    public function fetchFolders(EmailAccount $account): array
    {
        if ($account->isTokenExpired()) {
            $this->refreshToken($account);
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return [
                ['name' => 'Inbox', 'remote_id' => 'inbox', 'type' => 'inbox'],
                ['name' => 'Sent Items', 'remote_id' => 'sentitems', 'type' => 'sent'],
                ['name' => 'Drafts', 'remote_id' => 'drafts', 'type' => 'drafts'],
                ['name' => 'Deleted Items', 'remote_id' => 'deleteditems', 'type' => 'trash'],
            ];
        }

        $res = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me/mailFolders');
        if ($res->failed()) {
            return [
                ['name' => 'Inbox', 'remote_id' => 'inbox', 'type' => 'inbox'],
                ['name' => 'Sent Items', 'remote_id' => 'sentitems', 'type' => 'sent'],
                ['name' => 'Drafts', 'remote_id' => 'drafts', 'type' => 'drafts'],
                ['name' => 'Deleted Items', 'remote_id' => 'deleteditems', 'type' => 'trash'],
            ];
        }

        $folders = [];
        foreach ($res->json('value', []) as $f) {
            $name = $f['displayName'] ?? 'Folder';
            $type = match (strtolower($name)) {
                'inbox' => 'inbox',
                'sent items', 'sent' => 'sent',
                'drafts' => 'drafts',
                'deleted items', 'trash' => 'trash',
                'junk email', 'spam' => 'spam',
                default => 'custom',
            };

            $folders[] = [
                'name' => $name,
                'remote_id' => $f['id'],
                'type' => $type,
            ];
        }

        return $folders ?: [
            ['name' => 'Inbox', 'remote_id' => 'inbox', 'type' => 'inbox'],
            ['name' => 'Sent Items', 'remote_id' => 'sentitems', 'type' => 'sent'],
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

        $url = $cursor ?: "https://graph.microsoft.com/v1.0/me/mailFolders/{$folder->remote_id}/messages";
        $params = $cursor ? [] : [
            '$top' => 100,
            '$orderby' => 'receivedDateTime desc',
            '$select' => 'id,conversationId,subject,body,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,flag,hasAttachments,internetMessageId',
        ];

        $res = Http::withToken($accessToken)->get($url, $params);
        if ($res->failed()) {
            Log::warning('Microsoft Graph fetch messages failed', ['error' => $res->body()]);

            return ['messages' => [], 'next_cursor' => $cursor];
        }

        $nextLink = $res->json('@odata.nextLink') ?? $res->json('@odata.deltaLink');
        $synced = [];

        foreach ($res->json('value', []) as $item) {
            try {
                $from = $item['from']['emailAddress'] ?? [];
                $to = collect($item['toRecipients'] ?? [])->pluck('emailAddress.address')->filter()->values()->toArray();
                $cc = collect($item['ccRecipients'] ?? [])->pluck('emailAddress.address')->filter()->values()->toArray();
                $bcc = collect($item['bccRecipients'] ?? [])->pluck('emailAddress.address')->filter()->values()->toArray();

                $bodyHtml = null;
                $bodyText = null;

                if (isset($item['body']['contentType'])) {
                    if (strtolower($item['body']['contentType']) === 'html') {
                        $bodyHtml = $item['body']['content'];
                    } else {
                        $bodyText = $item['body']['content'];
                    }
                }

                $messageIdHeader = $item['internetMessageId'] ?? "<{$item['id']}@graph.microsoft.com>";

                $synced[] = [
                    'message_id_remote' => $item['id'],
                    'message_id_header' => $messageIdHeader,
                    'thread_id' => $item['conversationId'] ?? null,
                    'subject' => $item['subject'] ?? null,
                    'body_html' => $bodyHtml,
                    'body_text' => $bodyText,
                    'from_address' => $from['address'] ?? '',
                    'from_name' => $from['name'] ?? null,
                    'to_recipients' => $to,
                    'cc_recipients' => $cc ?: null,
                    'bcc_recipients' => $bcc ?: null,
                    'received_at' => isset($item['receivedDateTime']) ? Carbon::parse($item['receivedDateTime']) : now(),
                    'is_read' => $item['isRead'] ?? false,
                    'is_flagged' => isset($item['flag']['flagStatus']) && strtolower($item['flag']['flagStatus']) === 'flagged',
                    'size' => 0,
                    'payload_raw' => $item,
                ];
            } catch (\Throwable $e) {
                Log::warning('Failed to parse MS Graph message', ['id' => $item['id'] ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        return [
            'messages' => $synced,
            'next_cursor' => $nextLink,
        ];
    }

    public function sendMessage(EmailAccount $account, array $payload): array
    {
        if ($account->isTokenExpired()) {
            $this->refreshToken($account);
        }

        $accessToken = $account->getDecryptedAccessToken();
        if (! $accessToken) {
            return ['success' => false, 'message_id' => null, 'error' => 'No Microsoft access token available.'];
        }

        $messagePayload = [
            'message' => [
                'subject' => $payload['subject'],
                'body' => [
                    'contentType' => 'html',
                    'content' => $payload['body_html'] ?? nl2br(e($payload['body_text'])),
                ],
                'toRecipients' => array_map(
                    fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                    explode(',', $payload['to']),
                ),
            ],
        ];

        if (! empty($payload['cc'])) {
            $messagePayload['message']['ccRecipients'] = array_map(
                fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                explode(',', $payload['cc']),
            );
        }

        if (! empty($payload['bcc'])) {
            $messagePayload['message']['bccRecipients'] = array_map(
                fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                explode(',', $payload['bcc']),
            );
        }

        if (! empty($payload['attachments'])) {
            $messagePayload['message']['attachments'] = array_map(function (array $att): array {
                $disk = $att['disk'] ?? 'local';
                $content = \Illuminate\Support\Facades\Storage::disk($disk)->get($att['path']);

                return [
                    '@odata.type' => '#microsoft.graph.fileAttachment',
                    'name' => $att['name'],
                    'contentType' => $att['mime'] ?? 'application/octet-stream',
                    'contentBytes' => base64_encode($content),
                ];
            }, $payload['attachments']);
        }

        $response = Http::withToken($accessToken)
            ->post('https://graph.microsoft.com/v1.0/me/sendMail', $messagePayload);

        if ($response->failed()) {
            return ['success' => false, 'message_id' => null, 'error' => 'Microsoft Graph API error: '.$response->body()];
        }

        return ['success' => true, 'message_id' => null, 'error' => null];
    }
}
