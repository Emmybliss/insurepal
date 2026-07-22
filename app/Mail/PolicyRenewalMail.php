<?php

namespace App\Mail;

use App\Models\EmailAccount;
use App\Models\Policy;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PolicyRenewalMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Policy $policy;

    public string $noticeType;   // 'expiring' | 'expired'

    public string $customerName;

    public string $tenantName;

    public ?string $tenantContact;

    public string $policyNumber;

    public ?string $policyClass;

    public string $effectiveDate;

    public string $expiryDate;

    public ?string $premiumAmount;

    public int $daysUntilExpiry;

    public string $renewalUrl;

    public string $emailSubject; // avoid clash with Mailable::$subject

    public function __construct(Policy $policy, string $noticeType)
    {
        $this->policy = $policy;
        $this->noticeType = $noticeType;

        // ── Customer display name ──────────────────────────────────────────────
        $customer = $policy->customer;
        $this->customerName = $customer
            ? (($customer->type === 'individual')
                ? trim("{$customer->first_name} {$customer->last_name}")
                : ($customer->company_name ?? 'Valued Customer'))
            : 'Valued Customer';

        // ── Tenant details ─────────────────────────────────────────────────────
        $tenant = $policy->tenant;
        $this->tenantName = $tenant?->company_name ?? $tenant?->name ?? config('app.name');
        $this->tenantContact = $tenant?->contact_email ?? $tenant?->email ?? null;

        // ── Policy details ─────────────────────────────────────────────────────
        $this->policyNumber = $policy->policy_number;
        $this->policyClass = $policy->policyClass?->name ?? null;
        $this->effectiveDate = $policy->effective_date
            ? \Carbon\Carbon::parse($policy->effective_date)->format('M d, Y')
            : 'N/A';
        $this->expiryDate = $policy->expiry_date
            ? \Carbon\Carbon::parse($policy->expiry_date)->format('M d, Y')
            : 'N/A';

        // Positive = future, negative = already past
        $this->daysUntilExpiry = $policy->expiry_date
            ? (int) now()->diffInDays(\Carbon\Carbon::parse($policy->expiry_date), false)
            : 0;

        $this->premiumAmount = $policy->premium_amount
            ? '₦'.number_format((float) $policy->premium_amount, 2)
            : null;

        $this->renewalUrl = url('/renewals');

        $this->emailSubject = $noticeType === 'expired'
            ? "Notice: Your Policy {$this->policyNumber} has Expired — {$this->tenantName}"
            : "Reminder: Your Policy {$this->policyNumber} is Expiring Soon — {$this->tenantName}";

        // ── Apply tenant SMTP configuration ──────────────────────────────────
        // This is done in the constructor so it runs both synchronously and in
        // queued jobs. The TenantAwareMail trait's config() calls are process-
        // level and isolated per-job when using the database queue.
        $this->applyTenantSmtp($tenant);
    }

    /**
     * Apply tenant SMTP settings (custom creds or fall back to global .env).
     */
    private function applyTenantSmtp(?Tenant $tenant): void
    {
        if (! $tenant) {
            return;
        }

        $senderName = $tenant->company_name ?? $tenant->name ?? config('app.name');

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
            ]);

            Mail::purge('smtp');

            $this->from($senderEmail, $senderName)
                ->replyTo($tenant->contact_email ?? $tenant->email ?? $senderEmail, $senderName);

            Log::info("[PolicyRenewalMail] Using system-default EmailAccount for tenant: {$senderName} <{$senderEmail}>");
        } else {
            $senderEmail = config('mail.from.address');

            $this->from($senderEmail, $senderName);

            if ($tenant->contact_email ?? $tenant->email) {
                $this->replyTo($tenant->contact_email ?? $tenant->email, $senderName);
            }

            Log::info("[PolicyRenewalMail] Using global SMTP for tenant: {$senderName}");
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $customerEmail = $this->policy->customer?->email ?? config('mail.from.address');

        return new Envelope(
            to: [new Address($customerEmail, $this->customerName)],
            subject: $this->emailSubject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.policy-renewal-notice',
            with: [
                'subject' => $this->emailSubject,
                'noticeType' => $this->noticeType,
                'customerName' => $this->customerName,
                'tenantName' => $this->tenantName,
                'tenantContact' => $this->tenantContact,
                'policyNumber' => $this->policyNumber,
                'policyClass' => $this->policyClass,
                'effectiveDate' => $this->effectiveDate,
                'expiryDate' => $this->expiryDate,
                'premiumAmount' => $this->premiumAmount,
                'daysUntilExpiry' => $this->daysUntilExpiry,
                'renewalUrl' => $this->renewalUrl,
            ],
        );
    }
}
