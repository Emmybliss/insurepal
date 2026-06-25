<?php

namespace App\Services\Documents;

use App\Models\Tenant;
use App\Models\TenantTemplateOverride;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class HtmlTemplatePdfGenerator
{
    protected TenantBrandingService $brandingService;

    protected DocumentVerificationService $verificationService;

    public function __construct(
        TenantBrandingService $brandingService,
        DocumentVerificationService $verificationService
    ) {
        $this->brandingService = $brandingService;
        $this->verificationService = $verificationService;
    }

    /**
     * Generate PDF from an HTML template, store it, and return path + metadata.
     *
     * @param  string  $documentType  e.g. 'debit-notes'
     * @return array{path: string, file_size: int, file_hash: string}
     */
    public function generateAndStore(Tenant $tenant, string $templateKey, array $payload, string $documentType, ?string $customFileName = null): array
    {
        $html = $this->renderHtml($tenant, $templateKey, $payload);

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
                'isFontSubsettingEnabled' => true,
                'isJavascriptEnabled' => false,
            ]);

        $fileName = $customFileName ?? uniqid("{$documentType}-").'.pdf';
        $pdfContent = $pdf->output();

        $path = "{$documentType}/{$tenant->id}/pdfs/{$fileName}";

        Storage::disk('public')->put($path, $pdfContent);

        return [
            'path' => $path,
            'file_size' => strlen($pdfContent),
            'file_hash' => hash('sha256', $pdfContent),
        ];
    }

    /**
     * Generate PDF from an HTML template and return the raw PDF bytes.
     */
    public function generateOutput(Tenant $tenant, string $templateKey, array $payload): string
    {
        $html = $this->renderHtml($tenant, $templateKey, $payload);

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
                'isFontSubsettingEnabled' => true,
                'isJavascriptEnabled' => false,
            ]);

        return $pdf->output();
    }

    protected function buildVerifyUrl(string $documentType, string $token): string
    {
        $routeMap = [
            'credit_note' => 'verify.credit-note',
            'debit_note' => 'verify.debit-note',
            'invoice' => 'verify.invoice',
            'receipt' => 'verify.receipt',
            'broker_slip' => 'broker-slips.verify',
        ];

        $routeName = $routeMap[$documentType] ?? null;

        if ($routeName && \Illuminate\Support\Facades\Route::has($routeName)) {
            // For broker slips, the route uses model binding (ID), not a token
            if ($documentType === 'broker_slip') {
                return route($routeName, ['brokerSlip' => $token]);
            }

            return route($routeName, ['token' => $token]);
        }

        return '';
    }

    /**
     * Render the Blade view into an HTML string.
     */
    public function renderHtml(Tenant $tenant, string $templateKey, array $payload, ?array $cssOverrides = null, ?array $labelOverrides = null, bool $isPreview = false, ?array $elementToggles = null): string
    {
        $registry = config('document-templates.templates', []);
        $resolvedKey = $templateKey;

        if (! isset($registry[$resolvedKey])) {
            // Try fuzzy matching (ignore dots and underscores)
            $normalizedSearch = str_replace(['_', '.'], '', $templateKey);

            foreach ($registry as $registeredKey => $config) {
                if (str_replace(['_', '.'], '', $registeredKey) === $normalizedSearch) {
                    $resolvedKey = $registeredKey;
                    break;
                }
            }
        }

        if (! isset($registry[$resolvedKey])) {
            throw new \Exception("Template '{$templateKey}' is not registered. Available keys: ".implode(', ', array_keys($registry)));
        }

        $viewPath = $registry[$resolvedKey]['view_path'];

        if (! view()->exists($viewPath)) {
            throw new \Exception("View path '{$viewPath}' for template '{$templateKey}' does not exist.");
        }

        $templateOverride = TenantTemplateOverride::where('tenant_id', $tenant->id)
            ->where('template_key', $resolvedKey)
            ->first();

        $branding = $this->brandingService->getBrandingData($tenant, $templateOverride?->only(['header_image', 'footer_image', 'signature', 'stamp']));

        $elementToggles = $elementToggles ?? $templateOverride?->element_toggles ?? [];

        // Resolve labels: registry defaults or override settings
        $editableLabels = $registry[$resolvedKey]['editable_labels'] ?? [];
        $labels = [];
        foreach ($editableLabels as $key => $config) {
            $labels[$config['key']] = ($labelOverrides)[$config['key']] ?? $config['default'];
        }

        // Apply CSS string from overrides if provided
        $cssString = $cssOverrides ? $this->brandingService->generateCssString($cssOverrides) : null;

        // Support direct base64 image overrides (for real-time preview)
        if (! empty($payload['header_image_base64']) && empty($payload['clear_header_image'])) {
            $branding['header_image_base64'] = $payload['header_image_base64'];
        }
        if (! empty($payload['footer_image_base64']) && empty($payload['clear_footer_image'])) {
            $branding['footer_image_base64'] = $payload['footer_image_base64'];
        }

        if (! empty($payload['clear_header_image'])) {
            $branding['header_image_base64'] = null;
        }
        if (! empty($payload['clear_footer_image'])) {
            $branding['footer_image_base64'] = null;
        }

        // Convert preparer signature URL to base64 for PDF stability
        $signaturePath = $payload['preparer_signature'] ?? $payload['preparer_signature_url'] ?? null;
        if (! empty($signaturePath)) {
            $payload['preparer_signature_base64'] = $this->brandingService->imageToBase64($signaturePath);
        }

        // Inject verification data (barcode, QR code, verification URL)
        $documentType = $registry[$resolvedKey]['type'] ?? 'document';
        $documentNumber = $payload['note_number']
            ?? $payload['invoice_number']
            ?? $payload['receipt_number']
            ?? $payload['slip_number']
            ?? '';
        $verificationToken = $payload['verification_token']
            ?? $payload['document_number']
            ?? $documentNumber;

        $verificationUrl = ! $isPreview
            ? $this->buildVerifyUrl($documentType, $verificationToken)
            : null;

        $qrData = $verificationUrl ?: $documentNumber;

        // Merge payload, branding and template data for the view
        $viewData = array_merge([
            'branding' => $branding,
            'template' => null,
            'labels' => $labels,
            'payload' => $payload,
            'isPreview' => $isPreview,
            'css_overrides_string' => $cssString,
            'element_toggles' => $elementToggles,
            'verification_url' => $verificationUrl,
            'barcode_base64' => $this->verificationService->generateBarcodeBase64($documentNumber),
            'qr_base64' => $this->verificationService->generateQrCodeBase64($qrData),
            'barcode_data' => $documentNumber,
        ], $payload);

        return view($viewPath, $viewData)->render();
    }
}
