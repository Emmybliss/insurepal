<?php

namespace App\Http\Controllers;

use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Services\Documents\DocumentVerificationService;
use Inertia\Inertia;

class VerifyDocumentController extends Controller
{
    public function __construct(
        protected DocumentVerificationService $verificationService
    ) {}

    public function creditNote(string $token)
    {
        $note = CreditNote::with(['customer', 'policy.policyProduct', 'tenant'])
            ->where('verification_token', $token)
            ->first();

        if (! $note) {
            return Inertia::render('verify/Document', [
                'found' => false,
                'document' => null,
                'integrityValid' => null,
                'verifiedAt' => now()->toIso8601String(),
            ]);
        }

        $integrityValid = $note->snapshot_json
            ? $this->verificationService->generateDocumentHash($note->snapshot_json) === $note->document_hash
            : null;

        return Inertia::render('verify/Document', [
            'found' => true,
            'document' => [
                'type' => 'Credit Note',
                'number' => $note->note_number,
                'status' => $note->status,
                'amount' => number_format($note->amount ?? 0, 2),
                'total_amount' => number_format($note->total_amount ?? 0, 2),
                'currency' => $note->currency_code ?? 'NGN',
                'issue_date' => $note->issue_date?->format('F j, Y') ?? '',
                'customer_name' => $note->customer?->display_name ?? $note->customer?->first_name.' '.$note->customer?->last_name ?? 'N/A',
                'policy_number' => $note->policy?->policy_number ?? '',
                'company_name' => $note->tenant?->company_name ?? '',
            ],
            'integrityValid' => $integrityValid,
            'verifiedAt' => now()->toIso8601String(),
        ]);
    }

    public function debitNote(string $token)
    {
        $note = DebitNote::with(['customer', 'policy.policyProduct', 'tenant'])
            ->where('verification_token', $token)
            ->first();

        if (! $note) {
            return Inertia::render('verify/Document', [
                'found' => false,
                'document' => null,
                'integrityValid' => null,
                'verifiedAt' => now()->toIso8601String(),
            ]);
        }

        $integrityValid = $note->snapshot_json
            ? $this->verificationService->generateDocumentHash($note->snapshot_json) === $note->document_hash
            : null;

        return Inertia::render('verify/Document', [
            'found' => true,
            'document' => [
                'type' => 'Debit Note',
                'number' => $note->note_number,
                'status' => $note->status,
                'amount' => number_format($note->amount ?? 0, 2),
                'total_amount' => number_format($note->total_amount ?? 0, 2),
                'currency' => $note->currency_code ?? 'NGN',
                'issue_date' => $note->issue_date?->format('F j, Y') ?? '',
                'customer_name' => $note->customer?->display_name ?? $note->customer?->first_name.' '.$note->customer?->last_name ?? 'N/A',
                'policy_number' => $note->policy?->policy_number ?? '',
                'company_name' => $note->tenant?->company_name ?? '',
            ],
            'integrityValid' => $integrityValid,
            'verifiedAt' => now()->toIso8601String(),
        ]);
    }

    public function invoice(string $token)
    {
        $invoice = Invoice::with(['customer', 'policy', 'tenant'])
            ->where('verification_token', $token)
            ->first();

        if (! $invoice) {
            return Inertia::render('verify/Document', [
                'found' => false,
                'document' => null,
                'integrityValid' => null,
                'verifiedAt' => now()->toIso8601String(),
            ]);
        }

        $integrityValid = $invoice->snapshot_json
            ? $this->verificationService->generateDocumentHash($invoice->snapshot_json) === $invoice->document_hash
            : null;

        return Inertia::render('verify/Document', [
            'found' => true,
            'document' => [
                'type' => 'Invoice',
                'number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'amount' => number_format($invoice->subtotal ?? 0, 2),
                'total_amount' => number_format($invoice->total_amount ?? 0, 2),
                'currency' => $invoice->currency ?? 'NGN',
                'issue_date' => $invoice->created_at?->format('F j, Y') ?? '',
                'customer_name' => $invoice->customer?->display_name ?? $invoice->customer?->first_name.' '.$invoice->customer?->last_name ?? 'N/A',
                'policy_number' => $invoice->policy?->policy_number ?? '',
                'company_name' => $invoice->tenant?->company_name ?? '',
            ],
            'integrityValid' => $integrityValid,
            'verifiedAt' => now()->toIso8601String(),
        ]);
    }

    public function receipt(string $token)
    {
        $receipt = Receipt::with(['customer', 'invoice', 'tenant'])
            ->where('verification_token', $token)
            ->first();

        if (! $receipt) {
            return Inertia::render('verify/Document', [
                'found' => false,
                'document' => null,
                'integrityValid' => null,
                'verifiedAt' => now()->toIso8601String(),
            ]);
        }

        $integrityValid = $receipt->snapshot_json
            ? $this->verificationService->generateDocumentHash($receipt->snapshot_json) === $receipt->document_hash
            : null;

        return Inertia::render('verify/Document', [
            'found' => true,
            'document' => [
                'type' => 'Receipt',
                'number' => $receipt->receipt_number,
                'status' => $receipt->payment_status ?? $receipt->status,
                'amount' => number_format($receipt->amount_paid ?? 0, 2),
                'total_amount' => number_format($receipt->amount_paid ?? 0, 2),
                'currency' => $receipt->currency ?? 'NGN',
                'issue_date' => $receipt->payment_date?->format('F j, Y') ?? '',
                'customer_name' => $receipt->customer?->display_name ?? $receipt->customer?->first_name.' '.$receipt->customer?->last_name ?? 'N/A',
                'policy_number' => $receipt->invoice?->policy?->policy_number ?? '',
                'company_name' => $receipt->tenant?->company_name ?? '',
            ],
            'integrityValid' => $integrityValid,
            'verifiedAt' => now()->toIso8601String(),
        ]);
    }
}
