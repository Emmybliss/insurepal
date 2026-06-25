<?php

namespace App\Services;

use App\Models\Policy;
use App\Models\PolicyNotificationLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private string $provider;

    private string $apiKey;

    private string $senderId;

    public function __construct()
    {
        $this->provider = config('services.sms.provider', 'log') ?: 'log';
        $this->apiKey = (string) config('services.sms.api_key', '');
        $this->senderId = config('services.sms.sender_id', 'InsurePal') ?: 'InsurePal';
    }

    public function sendRenewalNotice(Policy $policy, string $noticeType): bool
    {
        $customer = $policy->customer;

        if (! $customer || ! $customer->phone) {
            Log::warning("[SMS] No phone number for customer {$customer->id} on policy {$policy->policy_number}");

            return false;
        }

        $message = $this->buildRenewalMessage($policy, $noticeType);

        return $this->send($customer->phone, $message, $policy);
    }

    protected function buildRenewalMessage(Policy $policy, string $noticeType): string
    {
        $tenantName = $policy->tenant?->company_name ?? config('app.name');
        $expiryFormatted = $policy->expiry_date
            ? \Carbon\Carbon::parse($policy->expiry_date)->format('M d, Y')
            : 'N/A';

        if ($noticeType === 'expired') {
            return "[{$tenantName}] Your policy {$policy->policy_number} expired on {$expiryFormatted}. Please renew immediately.";
        }

        $days = $policy->expiry_date
            ? (int) now()->diffInDays(\Carbon\Carbon::parse($policy->expiry_date), false)
            : 0;

        if ($days <= 0) {
            return "[{$tenantName}] Your policy {$policy->policy_number} expires today ({$expiryFormatted}). Please renew now to avoid lapse.";
        }

        return "[{$tenantName}] Reminder: Your policy {$policy->policy_number} expires on {$expiryFormatted} ({$days} days). Renew now to stay covered.";
    }

    public function send(string $phone, string $message, ?Policy $policy = null): bool
    {
        $cleanPhone = $this->normalizePhone($phone);

        if (! $cleanPhone) {
            Log::warning("[SMS] Invalid phone number: {$phone}");

            return false;
        }

        $success = match ($this->provider) {
            'termii' => $this->sendViaTermii($cleanPhone, $message),
            'twilio' => $this->sendViaTwilio($cleanPhone, $message),
            default => $this->logOnly($cleanPhone, $message),
        };

        if ($policy) {
            $this->logNotification($policy, $cleanPhone, $success);
        }

        return $success;
    }

    protected function normalizePhone(string $phone): ?string
    {
        $clean = preg_replace('/[^0-9+]/', '', $phone);

        if (strlen($clean) < 10) {
            return null;
        }

        if (! str_starts_with($clean, '+')) {
            $clean = '+234'.ltrim($clean, '0');
        }

        return $clean;
    }

    protected function sendViaTermii(string $phone, string $message): bool
    {
        if (empty($this->apiKey)) {
            Log::warning('[SMS/Termii] API key not configured, falling back to log-only mode');

            return $this->logOnly($phone, $message);
        }

        try {
            $response = Http::timeout(15)
                ->post('https://api.termii.com/api/sms/send', [
                    'api_key' => $this->apiKey,
                    'to' => $phone,
                    'from' => $this->senderId,
                    'sms' => $message,
                    'type' => 'plain',
                    'channel' => 'generic',
                ]);

            if ($response->successful()) {
                $body = $response->json();
                Log::info('[SMS/Termii] Sent successfully', [
                    'phone' => substr($phone, 0, 8).'****',
                    'message_id' => $body['message_id'] ?? null,
                ]);

                return true;
            }

            Log::error('[SMS/Termii] Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error("[SMS/Termii] Exception: {$e->getMessage()}");

            return false;
        }
    }

    protected function sendViaTwilio(string $phone, string $message): bool
    {
        $accountSid = config('services.twilio.account_sid');
        $authToken = config('services.twilio.auth_token');
        $fromNumber = config('services.twilio.from_number');

        if (empty($accountSid) || empty($authToken) || empty($fromNumber)) {
            Log::warning('[SMS/Twilio] Credentials not configured, falling back to log-only mode');

            return $this->logOnly($phone, $message);
        }

        try {
            $response = Http::basicAuth($accountSid, $authToken)
                ->timeout(15)
                ->asForm()
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                    'To' => $phone,
                    'From' => $fromNumber,
                    'Body' => $message,
                ]);

            if ($response->successful()) {
                $body = $response->json();
                Log::info('[SMS/Twilio] Sent successfully', [
                    'phone' => substr($phone, 0, 8).'****',
                    'sid' => $body['sid'] ?? null,
                ]);

                return true;
            }

            Log::error('[SMS/Twilio] Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error("[SMS/Twilio] Exception: {$e->getMessage()}");

            return false;
        }
    }

    protected function logOnly(string $phone, string $message): bool
    {
        Log::info("[SMS LOG] To: {$phone} | Message: {$message}");

        return true;
    }

    protected function logNotification(Policy $policy, string $recipient, bool $success, ?string $errorMessage = null): void
    {
        PolicyNotificationLog::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'channel' => 'sms',
            'recipient' => $recipient,
            'is_successful' => $success,
            'error_message' => $errorMessage,
            'notice_type' => $policy->isExpired() ? 'expired' : 'expiring',
        ]);
    }
}
