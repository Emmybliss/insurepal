<?php

namespace App\Services\Finance;

use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Receipt;
use App\Services\DocumentGenerationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GenerateReceiptService
{
    public function __construct(
        protected DocumentGenerationService $documentService
    ) {}

    public function generate(array $data, int $tenantId, int $userId): Receipt
    {
        return DB::transaction(function () use ($data, $tenantId, $userId) {
            $receipt = Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber($tenantId),
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'invoice_id' => $data['invoice_id'] ?? null,
                'customer_id' => $data['customer_id'],
                'policy_id' => $data['policy_id'] ?? null,
                'amount_paid' => $data['amount_paid'],
                'payment_method' => $data['payment_method'],
                'payment_date' => $data['payment_date'],
                'transaction_id' => $data['transaction_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'currency' => $data['currency'],
            ]);

            $this->syncInvoiceStatus($receipt);

            return $receipt->fresh();
        });
    }

    public function update(Receipt $receipt, array $data): Receipt
    {
        return DB::transaction(function () use ($receipt, $data) {
            $receipt->update($data);

            $invoiceId = $data['invoice_id'] ?? $receipt->invoice_id;
            if ($invoiceId) {
                $this->syncInvoiceStatusForInvoiceId($invoiceId);
            }

            return $receipt->fresh();
        });
    }

    public function markAsCompleted(Receipt $receipt): Receipt
    {
        return DB::transaction(function () use ($receipt) {
            $receipt->update(['payment_status' => Receipt::STATUS_COMPLETED]);
            $this->syncInvoiceStatus($receipt);

            return $receipt->fresh();
        });
    }

    public function markAsRefunded(Receipt $receipt): Receipt
    {
        return DB::transaction(function () use ($receipt) {
            $receipt->update(['payment_status' => Receipt::STATUS_REFUNDED]);
            $this->syncInvoiceStatus($receipt);

            return $receipt->fresh();
        });
    }

    public function void(Receipt $receipt, ?string $reason = null): Receipt
    {
        return DB::transaction(function () use ($receipt, $reason) {
            $receipt->void($reason);
            $this->syncInvoiceStatus($receipt);

            return $receipt->fresh();
        });
    }

    public function generateReceiptNumber(int $tenantId): string
    {
        return Receipt::generateReceiptNumber($tenantId);
    }

    public function generatePdf(Receipt $receipt, ?array $template): string
    {
        return $this->documentService->generateReceiptPdf($receipt, $template);
    }

    public function generateHtml(Receipt $receipt, ?array $template): string
    {
        return $this->documentService->generateReceiptHtml($receipt, $template, true);
    }

    public function storePdf(Receipt $receipt, string $pdfContent): Receipt
    {
        return DB::transaction(function () use ($receipt, $pdfContent) {
            $fileName = 'receipt_'.$receipt->id.'_'.time().'.pdf';
            $filePath = 'receipts/'.$fileName;

            Storage::disk('public')->put($filePath, $pdfContent);

            $receipt->update([
                'file_path' => $filePath,
                'payment_status' => Receipt::STATUS_COMPLETED,
            ]);

            return $receipt->fresh();
        });
    }

    public function quickCreate(Policy $policy, int $userId): Receipt
    {
        return DB::transaction(function () use ($policy, $userId) {
            $invoice = $policy->invoices()->latest()->first();

            if (! $invoice) {
                $lastInvoice = Invoice::withTrashed()
                    ->where('tenant_id', $policy->tenant_id)
                    ->latest('id')
                    ->first();
                $lastNumber = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -6) : 0;
                $newInvNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

                $invoice = Invoice::create([
                    'invoice_number' => $newInvNumber,
                    'tenant_id' => $policy->tenant_id,
                    'customer_id' => $policy->customer_id,
                    'policy_id' => $policy->id,
                    'user_id' => $userId,
                    'total_amount' => $policy->premium_amount,
                    'subtotal' => $policy->premium_amount,
                    'status' => 'draft',
                    'due_date' => now(),
                    'currency' => 'NGN',
                ]);
            }

            $receiptNumber = Receipt::generateReceiptNumber($policy->tenant_id);

            return Receipt::create([
                'receipt_number' => $receiptNumber,
                'tenant_id' => $policy->tenant_id,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'invoice_id' => $invoice->id,
                'payment_date' => now(),
                'payment_method' => 'other',
                'amount_paid' => $policy->premium_amount,
                'currency' => 'NGN',
                'payment_status' => 'pending',
                'notes' => "Quick receipt generated for policy #{$policy->policy_number}",
            ]);
        });
    }

    protected function syncInvoiceStatus(Receipt $receipt): void
    {
        if (! $receipt->invoice_id) {
            return;
        }

        $this->syncInvoiceStatusForInvoiceId($receipt->invoice_id);
    }

    protected function syncInvoiceStatusForInvoiceId(int $invoiceId): void
    {
        $invoice = Invoice::findOrFail($invoiceId);
        $totalPaid = $invoice->receipts()
            ->where('payment_status', Receipt::STATUS_COMPLETED)
            ->sum('amount_paid');

        if ($totalPaid >= $invoice->total_amount) {
            $invoice->update(['status' => Invoice::STATUS_PAID]);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'partially_paid']);
        } else {
            $invoice->update(['status' => Invoice::STATUS_SENT]);
        }
    }
}
