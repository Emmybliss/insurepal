<?php

namespace App\Services\Documents;

use App\Models\BrokerSlip;
use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Receipt;

class FinancialNotePayloadMapper
{
    /**
     * Map a DebitNote to a standardized template payload.
     */
    public function mapDebitNote(DebitNote $debitNote): array
    {
        $debitNote->loadMissing(['customer', 'policy', 'tenant', 'createdBy']);

        return [
            // ... (keep existing fields)
            'note_number' => $debitNote->note_number,
            'issue_date' => $debitNote->issue_date ? $debitNote->issue_date->format('F j, Y') : ($debitNote->created_at ? $debitNote->created_at->format('F j, Y') : ''),
            'due_date' => $debitNote->due_date ? $debitNote->due_date->format('F j, Y') : '',
            'customer_name' => $this->getCustomerName($debitNote->customer),
            'customer_address' => $debitNote->customer ? $debitNote->customer->address : '',
            'policy_number' => $debitNote->policy ? $debitNote->policy->policy_number : 'To Be Advised',
            'amount' => number_format($debitNote->amount ?? 0, 2),
            'tax_amount' => number_format($debitNote->tax_amount ?? 0, 2),
            'total_amount' => number_format($debitNote->total_amount ?? 0, 2),
            'description' => $debitNote->description ?? '',
            'currency' => $debitNote->currency_code ?? 'NGN',
            'insurer_name' => optional($debitNote->policy)->insurer_name ?? 'N/A',
            'insurer_address' => optional($debitNote->policy)->insurer_address ?? '',
            'insurer_email' => optional($debitNote->policy)->insurer_email ?? '',
            'insurer_phone' => optional($debitNote->policy)->insurer_phone ?? '',
            'verification_token' => $debitNote->verification_token,
            ...$this->getPreparerData($debitNote->createdBy),
        ];
    }

    /**
     * Map a CreditNote to a standardized template payload.
     */
    public function mapCreditNote(CreditNote $creditNote): array
    {
        $creditNote->loadMissing(['customer', 'policy', 'tenant', 'createdBy']);

        // Use direct insurer fields on credit note, fallback to policy insurer if not set
        $insurerName = $creditNote->insurer_name
            ?? $creditNote->policy?->insurer_name
            ?? 'N/A';
        $insurerAddress = $creditNote->insurer_address
            ?? $creditNote->policy?->insurer_address
            ?? '';
        $insurerEmail = $creditNote->insurer_email
            ?? $creditNote->policy?->insurer_email
            ?? '';
        $insurerPhone = $creditNote->insurer_phone
            ?? $creditNote->policy?->insurer_phone
            ?? '';

        return [
            'note_number' => $creditNote->note_number,
            'issue_date' => $creditNote->issue_date ? $creditNote->issue_date->format('F j, Y') : ($creditNote->created_at ? $creditNote->created_at->format('F j, Y') : ''),
            'customer_name' => $this->getCustomerName($creditNote->customer),
            'customer_address' => $creditNote->customer ? $creditNote->customer->address : '',
            'policy_number' => $creditNote->policy ? $creditNote->policy->policy_number : 'To Be Advised',
            'amount' => number_format($creditNote->amount ?? 0, 2),
            'tax_amount' => number_format($creditNote->tax_amount ?? 0, 2),
            'total_amount' => number_format($creditNote->total_amount ?? 0, 2),
            'description' => $creditNote->description ?? '',
            'currency' => $creditNote->currency_code ?? 'NGN',
            'insurer_name' => $insurerName,
            'insurer_address' => $insurerAddress,
            'insurer_email' => $insurerEmail,
            'insurer_phone' => $insurerPhone,
            'verification_token' => $creditNote->verification_token,
            ...$this->getPreparerData($creditNote->createdBy),
        ];
    }

    /**
     * Map an Invoice to a standardized template payload.
     */
    public function mapInvoice(Invoice $invoice): array
    {
        $invoice->loadMissing(['customer', 'items', 'tenant', 'user']);

        return [
            'invoice_number' => $invoice->invoice_number,
            'invoice_date' => $invoice->created_at ? $invoice->created_at->format('F j, Y') : '',
            'due_date' => $invoice->due_date ? $invoice->due_date->format('F j, Y') : '',
            'customer_name' => $this->getCustomerName($invoice->customer),
            'customer_address' => $invoice->customer ? $invoice->customer->address : '',
            'subtotal' => number_format($invoice->subtotal ?? 0, 2),
            'tax_amount' => number_format($invoice->tax_amount ?? 0, 2),
            'discount_amount' => number_format($invoice->discount_amount ?? 0, 2),
            'total_amount' => number_format($invoice->total_amount ?? 0, 2),
            'currency' => $invoice->currency ?? 'NGN',
            'items' => $invoice->items->map(function ($item) {
                return [
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => number_format($item->unit_price, 2),
                    'total' => number_format($item->total, 2),
                ];
            })->toArray(),
            'verification_token' => $invoice->verification_token,
            ...$this->getPreparerData($invoice->user),
        ];
    }

    /**
     * Map a Receipt to a standardized template payload.
     */
    public function mapReceipt(Receipt $receipt): array
    {
        $receipt->loadMissing(['customer', 'invoice', 'tenant', 'user']);

        return [
            'receipt_number' => $receipt->receipt_number,
            'receipt_date' => $receipt->payment_date ? $receipt->payment_date->format('F j, Y') : ($receipt->created_at ? $receipt->created_at->format('F j, Y') : ''),
            'amount_paid' => number_format($receipt->amount_paid ?? 0, 2),
            'payment_method' => ucfirst(str_replace('_', ' ', $receipt->payment_method ?? '')),
            'transaction_reference' => $receipt->transaction_id ?? 'N/A',
            'customer_name' => $this->getCustomerName($receipt->customer),
            'invoice_number' => $receipt->invoice ? $receipt->invoice->invoice_number : 'N/A',
            'currency' => $receipt->currency ?? 'NGN',
            'verification_token' => $receipt->verification_token,
            ...$this->getPreparerData($receipt->user),
        ];
    }

    /**
     * Get the preparer's data (name and signature)
     */
    protected function getPreparerData($user = null): array
    {
        $user = $user ?? auth()->user();

        return [
            'preparer_name' => $user ? $user->name : '',
            'preparer_signature_url' => $user ? $user->signature_url : null,
            'preparer_signature' => $user ? $user->signature : null,
        ];
    }

    /**
     * Helper to get customer name based on type
     */
    /**
     * Map a BrokerSlip to a standardized template payload.
     */
    public function mapBrokerSlip(BrokerSlip $slip): array
    {
        $slip->loadMissing([
            'placement.customer',
            'placement.insured',
            'placement.policyProduct.policyClass',
            'placementMarket.insuranceCompany',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
            'createdBy',
            'tenant',
        ]);

        $customer = $slip->placement?->customer;
        $insurer = $slip->placementMarket?->insuranceCompany;

        return [
            'slip_number' => $slip->slip_number,
            'version' => $slip->version,
            'currency' => $slip->currency ?? 'NGN',
            'sum_insured' => number_format($slip->sum_insured ?? 0, 2),
            'rate' => $slip->rate,
            'rate_basis' => $slip->rate_basis,
            'gross_premium' => number_format($slip->gross_premium ?? 0, 2),
            'commission_rate' => $slip->commission_rate,
            'commission_amount' => number_format($slip->commission_amount ?? 0, 2),
            'co_broker_commission' => number_format($slip->co_broker_commission ?? 0, 2),
            'reporting_broker_commission' => number_format($slip->reporting_broker_commission ?? 0, 2),
            'fees' => number_format($slip->fees ?? 0, 2),
            'taxes' => number_format($slip->taxes ?? 0, 2),
            'discount' => number_format($slip->discount ?? 0, 2),
            'net_premium' => number_format($slip->net_premium ?? 0, 2),
            'period_start' => $slip->period_start ? $slip->period_start->format('jS F Y') : '',
            'period_end' => $slip->period_end ? $slip->period_end->format('jS F Y') : '',
            'customer_name' => $this->getCustomerName($customer),
            'customer_address' => $customer?->address ?? '',
            'insurer_name' => $insurer?->name ?? 'TBA',
            'insurer_address' => $insurer?->address ?? '',
            'policy_class' => $slip->placement?->policyProduct?->policyClass?->name ?? 'N/A',
            'product_name' => $slip->placement?->policyProduct?->name ?? 'N/A',
            'status' => $slip->status,
            'items' => $slip->items->map(function ($item) {
                return [
                    'item_type' => $item->item_type,
                    'description' => $item->description,
                    'sum_insured' => number_format($item->sum_insured, 2),
                ];
            })->toArray(),
            'clauses' => $slip->clauses->map(function ($clause) {
                return [
                    'title' => $clause->title,
                    'content' => $clause->content ?? $clause->text ?? '',
                    'clause_type' => $clause->clause_type,
                ];
            })->toArray(),
            'verification_token' => (string) $slip->id,
            ...$this->getPreparerData($slip->createdBy),
        ];
    }

    /**
     * Helper to get customer name based on type
     */
    protected function getCustomerName($customer): string
    {
        if (! $customer) {
            return 'N/A';
        }

        return $customer->type === 'corporate' ? ($customer->company_name ?? '') : trim("{$customer->first_name} {$customer->last_name}");
    }
}
