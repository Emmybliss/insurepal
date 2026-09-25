<?php

namespace App\Services\Email\Providers;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Contracts\EmailProviderInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SmtpProvider implements EmailProviderInterface
{
    public function testConnection(EmailAccount $account): array
    {
        $host = $account->smtp_host;
        $port = (int) ($account->smtp_port ?: 587);
        $encryption = strtolower($account->smtp_encryption ?: ($port === 465 ? 'ssl' : 'tls'));
        $password = $account->getDecryptedPassword();

        if (! $host) {
            return ['success' => false, 'error' => 'SMTP Host is missing.'];
        }

        try {
            $prefix = ($encryption === 'ssl') ? 'ssl://' : '';
            $timeout = 10;

            $errno = 0;
            $errstr = '';

            $fp = @fsockopen($prefix.$host, $port, $errno, $errstr, $timeout);

            if (! $fp) {
                return ['success' => false, 'error' => "Cannot connect to SMTP server {$host}:{$port} ({$errstr})"];
            }

            $response = fgets($fp, 512);
            if (substr($response, 0, 3) !== '220') {
                fclose($fp);

                return ['success' => false, 'error' => "SMTP server banner error: {$response}"];
            }

            fwrite($fp, "EHLO InsurePal\r\n");
            $response = fgets($fp, 512);

            fwrite($fp, "QUIT\r\n");
            fclose($fp);

            return ['success' => true, 'error' => null];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => 'SMTP test failed: '.$e->getMessage()];
        }
    }

    public function refreshToken(EmailAccount $account): bool
    {
        return true;
    }

    public function fetchFolders(EmailAccount $account): array
    {
        return [
            ['name' => 'Sent', 'remote_id' => 'Sent', 'type' => 'sent'],
        ];
    }

    public function fetchMessages(EmailAccount $account, EmailFolder $folder, ?string $cursor = null): array
    {
        return ['messages' => [], 'next_cursor' => null];
    }

    public function sendMessage(EmailAccount $account, array $payload): array
    {
        if (! $account->smtp_host) {
            return ['success' => false, 'message_id' => null, 'error' => 'SMTP host is not configured.'];
        }

        try {
            $port = (int) ($account->smtp_port ?: 587);
            $encryption = strtolower($account->smtp_encryption ?: ($port === 465 ? 'ssl' : 'tls'));
            $password = $account->getDecryptedPassword();

            $mailerConfig = [
                'transport' => 'smtp',
                'host' => $account->smtp_host,
                'port' => $port,
                'username' => $account->email,
                'password' => $password,
                'scheme' => $encryption === 'none' ? null : $encryption,
            ];

            $mailerName = 'tenant-smtp-'.$account->id;
            config(["mail.mailers.{$mailerName}" => $mailerConfig]);

            $messageIdHeader = null;

            Mail::mailer($mailerName)->send([], [], function (\Illuminate\Mail\Message $message) use ($payload, $account, &$messageIdHeader) {
                $to = array_map('trim', explode(',', $payload['to']));
                $message->to($to)
                    ->subject($payload['subject'])
                    ->from($account->email, $account->account_name ?: $account->email);

                if (! empty($payload['body_html'])) {
                    $message->html($payload['body_html']);
                } else {
                    $message->text($payload['body_text']);
                }

                if (! empty($payload['cc'])) {
                    $cc = array_map('trim', explode(',', $payload['cc']));
                    $message->cc($cc);
                }

                if (! empty($payload['bcc'])) {
                    $bcc = array_map('trim', explode(',', $payload['bcc']));
                    $message->bcc($bcc);
                }

                if (! empty($payload['attachments'])) {
                    foreach ($payload['attachments'] as $att) {
                        $disk = $att['disk'] ?? 'local';
                        if (Storage::disk($disk)->exists($att['path'])) {
                            $content = Storage::disk($disk)->get($att['path']);
                            $message->attachData($content, $att['name'], ['mime' => $att['mime'] ?? 'application/octet-stream']);
                        }
                    }
                }

                $messageIdHeader = $message->getSymfonyMessage()->generateMessageId();
            });

            return [
                'success' => true,
                'message_id' => $messageIdHeader,
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('SMTP sendMessage failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
