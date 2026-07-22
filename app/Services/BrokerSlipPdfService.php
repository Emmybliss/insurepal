<?php

namespace App\Services;

use App\Enums\BrokerSlipStatus;
use App\Models\BrokerSlip;
use App\Models\TenantDefaultTemplate;
use App\Models\TenantTemplateOverride;
use App\Services\Documents\DocumentVerificationService;
use App\Services\Documents\TenantBrandingService;
use App\Services\Pdf\PdfService;
use Illuminate\Support\Facades\Storage;

class BrokerSlipPdfService
{
    public function __construct(
        protected TenantBrandingService $brandingService,
        protected DocumentVerificationService $verificationService,
        protected PdfService $pdfService,
    ) {}

    public function generatePdf(BrokerSlip $slip, bool $preview = false): string
    {
        $slip->loadMissing([
            'placement.customer',
            'placement.insured',
            'placement.policyClass',
            'placement.policyProduct.policyClass',
            'placementMarket.insuranceCompany',
            'risks' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
            'createdBy',
            'tenant',
        ]);

        $tenant = $slip->tenant;
        $user = $slip->createdBy ?? auth()->user();

        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($slip->tenant_id, 'broker_slip')
            ?? 'broker_slip.standard';

        $templateOverride = TenantTemplateOverride::query()
            ->where('tenant_id', $tenant->id)
            ->where('template_key', $defaultTemplateKey)
            ->first();

        $branding = $this->brandingService->getBrandingData(
            $tenant,
            $templateOverride?->only(['header_image', 'footer_image', 'signature', 'stamp'])
        );

        $watermarkText = $this->getWatermarkText($slip->status);

        $verificationUrl = $preview ? null : $this->getVerificationUrl($slip);

        $qrData = $verificationUrl ?: $slip->slip_number;

        $data = [
            'slip' => $slip,
            'placement' => $slip->placement,
            'customer' => $slip->placement->customer,
            'insured' => $slip->placement->insured ?? $slip->placement->customer,
            'insurer' => $slip->placementMarket?->insuranceCompany,
            'risks' => $slip->risks,
            'clauses' => $slip->clauses,
            'branding' => $branding,
            'preparer_signature_path' => $user ? $this->brandingService->getOptimizedImageLocalPath($user->signature, 'signature') : null,
            'preparer_signature' => $user ? $this->brandingService->imageToBase64($user->signature) : null,
            'preparer_name' => $user?->name ?? 'Preparer',
            'watermark' => $watermarkText,
            'isPreview' => $preview,
            'verificationUrl' => $verificationUrl,
            'barcode_base64' => $this->verificationService->generateBarcodeBase64($slip->slip_number),
            'qr_base64' => $this->verificationService->generateQrCodeBase64($qrData),
            'barcode_data' => $slip->slip_number,
        ];

        $registry = config('document-templates.templates', []);
        $templateConfig = $registry[$defaultTemplateKey] ?? null;
        $bladeTemplate = $templateConfig['view_path'] ?? 'pdf.templates.broker-slips.standard';

        $html = view($bladeTemplate, $data)->render();

        return $this->pdfService->renderHtml($html);
    }

    public function savePdf(BrokerSlip $slip): string
    {
        $pdfContent = $this->generatePdf($slip);

        $path = "broker-slips/{$slip->tenant_id}/{$slip->slip_number}/v{$slip->version}.pdf";
        Storage::disk('public')->put($path, $pdfContent);

        $slip->update(['pdf_path' => $path]);

        return $path;
    }

    protected function getWatermarkText(string $status): ?string
    {
        return match ($status) {
            BrokerSlipStatus::PendingReview->value => 'PENDING APPROVAL',
            BrokerSlipStatus::Approved->value => 'APPROVED',
            BrokerSlipStatus::Issued->value => null,
            BrokerSlipStatus::Superseded->value => 'SUPERSEDED',
            BrokerSlipStatus::Withdrawn->value => 'WITHDRAWN',
            default => null,
        };
    }

    protected function getVerificationUrl(BrokerSlip $slip): string
    {
        return route('broker-slips.verify', ['brokerSlip' => $slip->id]);
    }
}
