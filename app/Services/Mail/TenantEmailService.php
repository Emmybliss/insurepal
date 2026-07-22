<?php

namespace App\Services\Mail;

use App\Models\EmailAccount;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TenantEmailService
{
    public function getAccounts(Tenant $tenant): Collection
    {
        return $tenant->emailAccounts()->where('is_active', true)->get();
    }

    public function getDefaultAccount(Tenant $tenant): ?EmailAccount
    {
        return $tenant->emailAccounts()
            ->where('is_active', true)
            ->orderBy('is_system_default', 'desc')
            ->first();
    }

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
        if ($this->isTokenExpired($account)) {
            $refreshed = $this->refreshToken($account);

            if (! $refreshed) {
                return ['success' => false, 'error' => 'OAuth token expired and could not be refreshed. Please re-authenticate.'];
            }
        }

        try {
            $result = match ($account->provider) {
                'gmail' => $this->sendViaGmail($account, $to, $subject, $htmlBody ?? $body, $attachments, $cc, $bcc),
                'microsoft365' => $this->sendViaMicrosoft($account, $to, $subject, $htmlBody ?? $body, $attachments, $cc, $bcc),
                'smtp' => $this->sendViaSmtp($account, $to, $subject, $body, $htmlBody, $attachments, $cc, $bcc),
                'imap' => $this->sendViaSmtp($account, $to, $subject, $body, $htmlBody, $attachments, $cc, $bcc),
                default => $this->sendViaSmtp($account, $to, $subject, $body, $htmlBody, $attachments, $cc, $bcc),
            };

            if ($result['success']) {
                $this->persistSentMessage($account, $to, $subject, $body, $htmlBody);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Tenant email send failed', [
                'account_id' => $account->id,
                'tenant_id' => $account->tenant_id,
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function disconnect(EmailAccount $account): void
    {
        $account->update([
            'oauth_token_encrypted' => null,
            'refresh_token_encrypted' => null,
            'token_expires_at' => null,
            'is_active' => false,
        ]);
    }

    public function isTokenExpired(EmailAccount $account): bool
    {
        return $account->token_expires_at && $account->token_expires_at->isPast();
    }

    public function refreshToken(EmailAccount $account): bool
    {
        $refreshToken = $account->refresh_token_encrypted
            ? Crypt::decryptString($account->refresh_token_encrypted)
            : null;

        if (! $refreshToken) {
            return false;
        }

        try {
            $response = match ($account->provider) {
                'gmail' => Http::post('https://oauth2.googleapis.com/token', [
                    'client_id' => config('email.oauth.gmail.client_id'),
                    'client_secret' => config('email.oauth.gmail.client_secret'),
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                ]),
                'microsoft365' => Http::post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
                    'client_id' => config('email.oauth.microsoft365.client_id'),
                    'client_secret' => config('email.oauth.microsoft365.client_secret'),
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                ]),
                default => null,
            };

            if (! $response || $response->failed()) {
                Log::warning('OAuth token refresh failed', [
                    'account_id' => $account->id,
                    'provider' => $account->provider,
                ]);

                return false;
            }

            $data = $response->json();

            $account->update([
                'oauth_token_encrypted' => Crypt::encryptString($data['access_token']),
                'token_expires_at' => now()->addSeconds($data['expires_in'] ?? 3600),
            ]);

            if (isset($data['refresh_token'])) {
                $account->update([
                    'refresh_token_encrypted' => Crypt::encryptString($data['refresh_token']),
                ]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('OAuth token refresh exception', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    private function sendViaGmail(
        EmailAccount $account,
        string $to,
        string $subject,
        string $body,
        array $attachments = [],
        ?string $cc = null,
        ?string $bcc = null,
    ): array {
        $accessToken = Crypt::decryptString($account->oauth_token_encrypted);

        $mimeMessage = empty($attachments)
            ? $this->buildSimpleMimeMessage($account->email, $to, $subject, $body, $cc, $bcc)
            : $this->buildMultipartMimeMessage($account->email, $to, $subject, $body, $attachments, $cc, $bcc);

        $response = Http::withToken($accessToken)
            ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw' => $mimeMessage,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Gmail API error: '.$response->body());
        }

        return ['success' => true, 'message_id' => $response->json('id')];
    }

    /**
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    private function sendViaMicrosoft(
        EmailAccount $account,
        string $to,
        string $subject,
        string $body,
        array $attachments = [],
        ?string $cc = null,
        ?string $bcc = null,
    ): array {
        $accessToken = Crypt::decryptString($account->oauth_token_encrypted);

        $payload = [
            'message' => [
                'subject' => $subject,
                'body' => [
                    'contentType' => 'html',
                    'content' => $body,
                ],
                'toRecipients' => array_map(
                    fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                    explode(',', $to),
                ),
            ],
        ];

        if ($cc) {
            $payload['message']['ccRecipients'] = array_map(
                fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                explode(',', $cc),
            );
        }

        if ($bcc) {
            $payload['message']['bccRecipients'] = array_map(
                fn ($addr) => ['emailAddress' => ['address' => trim($addr)]],
                explode(',', $bcc),
            );
        }

        if (! empty($attachments)) {
            $payload['message']['attachments'] = array_map(function (array $att): array {
                $disk = $att['disk'] ?? 'local';
                $content = Storage::disk($disk)->get($att['path']);

                return [
                    '@odata.type' => '#microsoft.graph.fileAttachment',
                    'name' => $att['name'],
                    'contentType' => $att['mime'],
                    'contentBytes' => base64_encode($content),
                ];
            }, $attachments);
        }

        $response = Http::withToken($accessToken)
            ->post('https://graph.microsoft.com/v1.0/me/sendMail', $payload);

        if ($response->failed()) {
            throw new \RuntimeException('Microsoft Graph API error: '.$response->body());
        }

        return ['success' => true];
    }

    /**
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    private function sendViaSmtp(
        EmailAccount $account,
        string $to,
        string $subject,
        string $body,
        ?string $htmlBody,
        array $attachments = [],
        ?string $cc = null,
        ?string $bcc = null,
    ): array {
        if (empty($account->smtp_host)) {
            return ['success' => false, 'error' => 'SMTP host is not configured for this account.'];
        }

        $config = [
            'transport' => 'smtp',
            'host' => $account->smtp_host,
            'port' => $account->smtp_port,
            'username' => $account->email,
            'password' => $account->credentials_encrypted
                ? Crypt::decryptString($account->credentials_encrypted)
                : null,
            'encryption' => $account->smtp_port === 465 ? 'ssl' : 'tls',
        ];

        $mailerName = 'tenant-'.$account->id;

        config(["mail.mailers.{$mailerName}" => $config]);

        \Illuminate\Support\Facades\Mail::mailer($mailerName)
            ->send([], [], function (\Illuminate\Mail\Message $message) use ($to, $subject, $htmlBody, $body, $account, $cc, $bcc, $attachments) {
                $message->to($to)
                    ->subject($subject)
                    ->from($account->email, $account->account_name)
                    ->html($htmlBody ?? nl2br(e($body)));

                if ($cc) {
                    $message->cc($cc);
                }

                if ($bcc) {
                    $message->bcc($bcc);
                }

                foreach ($attachments as $att) {
                    $disk = $att['disk'] ?? 'local';
                    $content = Storage::disk($disk)->get($att['path']);
                    $message->attachData($content, $att['name'], ['mime' => $att['mime']]);
                }
            });

        return ['success' => true];
    }

    /** Build a simple single-part HTML MIME message (no attachments). */
    private function buildSimpleMimeMessage(
        string $from,
        string $to,
        string $subject,
        string $body,
        ?string $cc = null,
        ?string $bcc = null,
    ): string {
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

    /**
     * Build a multipart/mixed MIME message with HTML body + attachments.
     *
     * @param  array<int, array{name: string, mime: string, path: string, disk?: string, temp?: bool}>  $attachments
     */
    private function buildMultipartMimeMessage(
        string $from,
        string $to,
        string $subject,
        string $body,
        array $attachments,
        ?string $cc = null,
        ?string $bcc = null,
    ): string {
        $boundary = 'boundary_'.uniqid();
        $raw = '';

        // Headers
        $raw .= "From: {$from}\r\n";
        $raw .= "To: {$to}\r\n";

        if ($cc) {
            $raw .= "Cc: {$cc}\r\n";
        }

        if ($bcc) {
            $raw .= "Bcc: {$bcc}\r\n";
        }

        $raw .= 'Subject: =?UTF-8?B?'.base64_encode($subject)."?=\r\n";
        $raw .= "MIME-Version: 1.0\r\n";
        $raw .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";

        // HTML body part
        $raw .= "--{$boundary}\r\n";
        $raw .= "Content-Type: text/html; charset=UTF-8\r\n";
        $raw .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $raw .= chunk_split(base64_encode($body))."\r\n";

        // Attachment parts
        foreach ($attachments as $att) {
            $disk = $att['disk'] ?? 'local';
            $fileContent = Storage::disk($disk)->get($att['path']);
            $encoded = chunk_split(base64_encode($fileContent));
            $safeName = addslashes($att['name']);

            $raw .= "--{$boundary}\r\n";
            $raw .= "Content-Type: {$att['mime']}; name=\"{$safeName}\"\r\n";
            $raw .= "Content-Transfer-Encoding: base64\r\n";
            $raw .= "Content-Disposition: attachment; filename=\"{$safeName}\"\r\n\r\n";
            $raw .= $encoded."\r\n";
        }

        $raw .= "--{$boundary}--";

        return rtrim(strtr(base64_encode($raw), ['+' => '-', '/' => '_']), '=');
    }

    private function persistSentMessage(EmailAccount $account, string $to, string $subject, string $body, ?string $htmlBody): void
    {
        $sentFolder = $account->sent();

        if (! $sentFolder) {
            return;
        }

        $account->messages()->create([
            'folder_id' => $sentFolder->id,
            'subject' => $subject,
            'body_text' => $body,
            'body_html' => $htmlBody,
            'from_address' => $account->email,
            'from_name' => $account->account_name,
            'to_recipients' => [$to],
            'received_at' => now(),
            'is_draft' => false,
        ]);
    }
}
