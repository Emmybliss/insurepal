<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Services\Documents\DocumentVerificationService;
use App\Services\Documents\FinancialNotePayloadMapper;
use App\Services\Documents\HtmlTemplatePdfGenerator;

class DocumentGenerationService
{
    public function generateInvoicePdf(Invoice $invoice, ?string $templateKey = null): string
    {
        $templateKey ??= 'invoice.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $payload = $mapper->mapInvoice($invoice);

        $this->persistVerificationData($invoice, $payload);

        return $generator->generateOutput($invoice->tenant, $templateKey, $payload);
    }

    public function generateReceiptPdf(Receipt $receipt, ?string $templateKey = null): string
    {
        $templateKey ??= 'receipt.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $payload = $mapper->mapReceipt($receipt);

        $this->persistVerificationData($receipt, $payload);

        return $generator->generateOutput($receipt->tenant, $templateKey, $payload);
    }

    public function generateCreditNotePdf(CreditNote $creditNote, ?string $templateKey = null): string
    {
        $templateKey ??= 'credit_note.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $payload = $mapper->mapCreditNote($creditNote);

        $this->persistVerificationData($creditNote, $payload);

        return $generator->generateOutput($creditNote->tenant, $templateKey, $payload);
    }

    public function generateDebitNotePdf(DebitNote $debitNote, ?string $templateKey = null): string
    {
        $templateKey ??= 'debit_note.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $payload = $mapper->mapDebitNote($debitNote);

        $this->persistVerificationData($debitNote, $payload);

        return $generator->generateOutput($debitNote->tenant, $templateKey, $payload);
    }

    protected function persistVerificationData($model, array $payload): void
    {
        if (! $model->verification_token) {
            $model->verification_token = app(DocumentVerificationService::class)->generateToken();
        }

        $verificationService = app(DocumentVerificationService::class);
        $snapshot = $verificationService->computeSnapshot($payload);
        $hash = $verificationService->generateDocumentHash($snapshot);

        $model->snapshot_json = $snapshot;
        $model->document_hash = $hash;
        $model->saveQuietly();
    }

    public function generateInvoiceHtml(Invoice $invoice, ?string $templateKey = null, bool $isPreview = false): string
    {
        $templateKey ??= 'invoice.classic';

        $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
        $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

        return $generator->renderHtml(
            $invoice->tenant,
            $templateKey,
            $mapper->mapInvoice($invoice),
            [],
            [],
            $isPreview
        );
    }

    public function generateReceiptHtml(Receipt $receipt, ?string $templateKey = null, bool $isPreview = false): string
    {
        $templateKey ??= 'receipt.classic';

        $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
        $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

        return $generator->renderHtml(
            $receipt->tenant,
            $templateKey,
            $mapper->mapReceipt($receipt),
            [],
            [],
            $isPreview
        );
    }

    public function generateCreditNoteHtml(CreditNote $creditNote, ?string $templateKey = null, bool $isPreview = false): string
    {
        $templateKey ??= 'credit_note.classic';

        $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
        $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

        return $generator->renderHtml(
            $creditNote->tenant,
            $templateKey,
            $mapper->mapCreditNote($creditNote),
            [],
            [],
            $isPreview
        );
    }

    public function generateDebitNoteHtml(DebitNote $debitNote, ?string $templateKey = null, bool $isPreview = false): string
    {
        $templateKey ??= 'debit_note.classic';

        $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
        $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

        return $generator->renderHtml(
            $debitNote->tenant,
            $templateKey,
            $mapper->mapDebitNote($debitNote),
            [],
            [],
            $isPreview
        );
    }
}
