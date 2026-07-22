<?php

namespace App\Services\Mail;

use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PlatformMailService
{
    public function send(string $to, string $subject, string $body, ?string $htmlBody = null): array
    {
        try {
            Mail::mailer('smtp')
                ->raw($body, function (Message $message) use ($to, $subject, $htmlBody) {
                    $message->to($to)
                        ->subject($subject);

                    if ($htmlBody) {
                        $message->html($htmlBody);
                    }
                });

            return ['success' => true, 'message' => 'Platform email sent successfully'];
        } catch (\Exception $e) {
            Log::error('Platform mail sending failed', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function sendMailable(string $to, object $mailable): array
    {
        try {
            Mail::mailer('smtp')->to($to)->send($mailable);

            return ['success' => true, 'message' => 'Platform email sent successfully'];
        } catch (\Exception $e) {
            Log::error('Platform mailable sending failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function sendRaw(array $to, string $subject, string $html, array $attachments = []): array
    {
        try {
            Mail::mailer('smtp')->send([], [], function (Message $message) use ($to, $subject, $html, $attachments) {
                $message->to($to)
                    ->subject($subject)
                    ->html($html);

                foreach ($attachments as $attachment) {
                    if (isset($attachment['data'])) {
                        $message->attachData($attachment['data'], $attachment['name'], [
                            'mime' => $attachment['mime'] ?? 'application/octet-stream',
                        ]);
                    } elseif (isset($attachment['path'])) {
                        $message->attach($attachment['path'], [
                            'as' => $attachment['name'] ?? null,
                            'mime' => $attachment['mime'] ?? null,
                        ]);
                    }
                }
            });

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('Platform raw email failed', ['to' => $to, 'error' => $e->getMessage()]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
