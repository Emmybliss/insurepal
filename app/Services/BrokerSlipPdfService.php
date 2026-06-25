<?php

namespace App\Services;

use App\Enums\BrokerSlipStatus;
use App\Models\BrokerSlip;
use App\Models\TenantDefaultTemplate;
use App\Services\Documents\DocumentVerificationService;
use App\Services\Documents\TenantBrandingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class BrokerSlipPdfService
{
    public function __construct(
        protected TenantBrandingService $brandingService,
        protected DocumentVerificationService $verificationService,
    ) {}

    public function generatePdf(BrokerSlip $slip, bool $preview = false): string
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

        $tenant = $slip->tenant;
        $user = auth()->user();
        $branding = $this->brandingService->getBrandingData($tenant);

        $watermarkText = $this->getWatermarkText($slip->status);

        $verificationUrl = $preview ? null : $this->getVerificationUrl($slip);

        $qrData = $verificationUrl ?: $slip->slip_number;

        $data = [
            'slip' => $slip,
            'placement' => $slip->placement,
            'customer' => $slip->placement->customer,
            'insured' => $slip->placement->insured ?? $slip->placement->customer,
            'insurer' => $slip->placementMarket?->insuranceCompany,
            'items' => $slip->items,
            'clauses' => $slip->clauses,
            'branding' => $branding,
            'preparer_signature' => $user ? $this->brandingService->imageToBase64($user->signature) : null,
            'preparer_name' => $user?->name ?? 'Preparer',
            'watermark' => $watermarkText,
            'isPreview' => $preview,
            'verificationUrl' => $verificationUrl,
            'barcode_base64' => $this->verificationService->generateBarcodeBase64($slip->slip_number),
            'qr_base64' => $this->verificationService->generateQrCodeBase64($qrData),
            'barcode_data' => $slip->slip_number,
        ];

        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($slip->tenant_id, 'broker_slip')
            ?? 'broker_slip.standard';

        $registry = config('document-templates.templates', []);
        $templateConfig = $registry[$defaultTemplateKey] ?? null;
        $bladeTemplate = $templateConfig['view_path'] ?? 'pdf.templates.broker-slips.standard';

        $html = view($bladeTemplate, $data)->render();
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4');

        return $pdf->output();
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
            BrokerSlipStatus::Draft->value => 'DRAFT',
            BrokerSlipStatus::PendingReview->value => 'PENDING APPROVAL',
            BrokerSlipStatus::ChangesRequested->value => 'DRAFT',
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
