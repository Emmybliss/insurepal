<?php

namespace App\Services;

use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Models\TenantDefaultTemplate;
use App\Models\TenantTemplateOverride;
use App\Services\Documents\DocumentVerificationService;
use App\Services\Documents\TenantBrandingService;
use App\Services\Pdf\PdfService;
use Illuminate\Support\Facades\Storage;

class QuotePdfService
{
    public function __construct(
        protected TenantBrandingService $brandingService,
        protected DocumentVerificationService $verificationService,
        protected PdfService $pdfService,
    ) {}

    public function generatePdf(Quote $quote, bool $preview = false): string
    {
        $quote->loadMissing([
            'customer',
            'policyClass',
            'policyType',
            'insuranceProduct.policyClass',
            'risks' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
            'createdBy',
            'tenant',
        ]);

        $tenant = $quote->tenant;
        $user = $quote->createdBy ?? auth()->user();

        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($quote->tenant_id, 'quote')
            ?? 'quote.standard';

        $templateOverride = TenantTemplateOverride::query()
            ->where('tenant_id', $tenant->id)
            ->where('template_key', $defaultTemplateKey)
            ->first();

        $branding = $this->brandingService->getBrandingData(
            $tenant,
            $templateOverride?->only(['header_image', 'footer_image', 'signature', 'stamp'])
        );

        $watermarkText = $this->getWatermarkText($quote->status);
        $verificationUrl = $preview ? null : $this->getVerificationUrl($quote);
        $qrData = $verificationUrl ?: $quote->quote_number;

        $data = [
            'quote' => $quote,
            'customer' => $quote->customer,
            'product' => $quote->insuranceProduct,
            'risks' => $quote->risks,
            'clauses' => $quote->clauses,
            'branding' => $branding,
            'preparer_signature_path' => $user ? $this->brandingService->getOptimizedImageLocalPath($user->signature, 'signature') : null,
            'preparer_signature' => $user ? $this->brandingService->imageToBase64($user->signature) : null,
            'preparer_name' => $user?->name ?? 'Preparer',
            'watermark' => $watermarkText,
            'isPreview' => $preview,
            'verificationUrl' => $verificationUrl,
            'barcode_base64' => $this->verificationService->generateBarcodeBase64($quote->quote_number),
            'qr_base64' => $this->verificationService->generateQrCodeBase64($qrData),
            'barcode_data' => $quote->quote_number,
        ];

        $registry = config('document-templates.templates', []);
        $templateConfig = $registry[$defaultTemplateKey] ?? null;
        $bladeTemplate = $templateConfig['view_path'] ?? 'pdf.templates.quotes.standard';

        $html = view($bladeTemplate, $data)->render();

        return $this->pdfService->renderHtml($html);
    }

    public function savePdf(Quote $quote): string
    {
        $pdfContent = $this->generatePdf($quote);

        $path = "quotes/{$quote->tenant_id}/{$quote->id}/v{$quote->version}.pdf";
        Storage::disk('public')->put($path, $pdfContent);

        $quote->update(['pdf_path' => $path]);

        return $path;
    }

    protected function getWatermarkText(string $status): ?string
    {
        return match ($status) {
            QuoteStatus::Draft->value => 'DRAFT QUOTE',
            QuoteStatus::PendingReview->value => 'PENDING APPROVAL',
            QuoteStatus::Approved->value => 'OFFICIAL QUOTE',
            QuoteStatus::Sent->value => null,
            QuoteStatus::Accepted->value => 'ACCEPTED QUOTE',
            QuoteStatus::Rejected->value => 'REJECTED',
            QuoteStatus::Converted->value => 'CONVERTED TO POLICY',
            QuoteStatus::Superseded->value => 'SUPERSEDED',
            QuoteStatus::Withdrawn->value => 'WITHDRAWN',
            QuoteStatus::Expired->value => 'EXPIRED',
            default => null,
        };
    }

    protected function getVerificationUrl(Quote $quote): string
    {
        return route('quotes.verify', ['quote' => $quote->id]);
    }
}
