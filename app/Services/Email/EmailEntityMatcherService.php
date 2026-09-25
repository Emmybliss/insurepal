<?php

namespace App\Services\Email;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\EmailMessage;
use App\Models\EmailThread;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Quote;

class EmailEntityMatcherService
{
    public function matchAndLink(EmailMessage $message, ?EmailThread $thread = null): array
    {
        return $this->matchAndLinkEntities($message, $thread);
    }

    public function matchAndLinkEntities(EmailMessage $message, ?EmailThread $thread = null): array
    {
        $tenantId = $message->account ? $message->account->tenant_id : null;
        if (! $tenantId) {
            return [];
        }

        $matched = [
            'customer_id' => null,
            'policy_id' => null,
            'claim_id' => null,
            'quote_id' => null,
            'invoice_id' => null,
        ];

        // 1. Customer matching via email addresses
        $addresses = array_filter(array_unique(array_merge(
            [$message->from_address],
            $message->to_recipients ?? [],
            $message->cc_recipients ?? []
        )));

        if (! empty($addresses)) {
            $customer = Customer::where('tenant_id', $tenantId)
                ->whereIn('email', $addresses)
                ->first();

            if ($customer) {
                $matched['customer_id'] = $customer->id;
            }
        }

        $subjectAndBody = ($message->subject ?? '').' '.($message->body_text ?? '');

        // 2. Policy matching
        if (preg_match('/POL[-\/\w\d]{4,30}/i', $subjectAndBody, $m)) {
            $policyNumber = trim($m[0]);
            $policy = Policy::where('tenant_id', $tenantId)
                ->where(function ($q) use ($policyNumber) {
                    $q->where('policy_number', $policyNumber)
                        ->orWhere('policy_number', 'like', "%{$policyNumber}%");
                })->first();

            if ($policy) {
                $matched['policy_id'] = $policy->id;
                if (! $matched['customer_id'] && $policy->customer_id) {
                    $matched['customer_id'] = $policy->customer_id;
                }
            }
        }

        // 3. Claim matching
        if (preg_match('/CLM[-\/\w\d]{4,30}/i', $subjectAndBody, $m)) {
            $claimNumber = trim($m[0]);
            $claim = Claim::where('tenant_id', $tenantId)
                ->where(function ($q) use ($claimNumber) {
                    $q->where('claim_number', $claimNumber)
                        ->orWhere('claim_number', 'like', "%{$claimNumber}%");
                })->first();

            if ($claim) {
                $matched['claim_id'] = $claim->id;
                if (! $matched['policy_id'] && $claim->policy_id) {
                    $matched['policy_id'] = $claim->policy_id;
                }
                if (! $matched['customer_id'] && $claim->customer_id) {
                    $matched['customer_id'] = $claim->customer_id;
                }
            }
        }

        // 4. Quote matching
        if (preg_match('/(QT|QUO)[-\/\w\d]{4,30}/i', $subjectAndBody, $m)) {
            $quoteNumber = trim($m[0]);
            $quote = Quote::where('tenant_id', $tenantId)
                ->where(function ($q) use ($quoteNumber) {
                    $q->where('quote_number', $quoteNumber)
                        ->orWhere('quote_number', 'like', "%{$quoteNumber}%");
                })->first();

            if ($quote) {
                $matched['quote_id'] = $quote->id;
                if (! $matched['customer_id'] && $quote->customer_id) {
                    $matched['customer_id'] = $quote->customer_id;
                }
            }
        }

        // 5. Invoice matching
        if (preg_match('/INV[-\/\w\d]{4,30}/i', $subjectAndBody, $m)) {
            $invoiceNumber = trim($m[0]);
            $invoice = Invoice::where('tenant_id', $tenantId)
                ->where(function ($q) use ($invoiceNumber) {
                    $q->where('invoice_number', $invoiceNumber)
                        ->orWhere('invoice_number', 'like', "%{$invoiceNumber}%");
                })->first();

            if ($invoice) {
                $matched['invoice_id'] = $invoice->id;
                if (! $matched['customer_id'] && $invoice->customer_id) {
                    $matched['customer_id'] = $invoice->customer_id;
                }
            }
        }

        // Update message entity links
        $message->update(array_filter($matched));

        // Update thread entity links if present
        if ($thread) {
            $threadUpdate = array_filter($matched);
            if (! empty($matched['customer_id'])) {
                $threadUpdate['related_type'] = 'customer';
                $threadUpdate['related_id'] = $matched['customer_id'];
            } elseif (! empty($matched['policy_id'])) {
                $threadUpdate['related_type'] = 'policy';
                $threadUpdate['related_id'] = $matched['policy_id'];
            } elseif (! empty($matched['claim_id'])) {
                $threadUpdate['related_type'] = 'claim';
                $threadUpdate['related_id'] = $matched['claim_id'];
            }
            $thread->update($threadUpdate);
        }

        return $matched;
    }
}
