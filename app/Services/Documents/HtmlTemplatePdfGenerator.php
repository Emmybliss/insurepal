<?php

namespace App\Services\Documents;

use App\Models\Tenant;
use App\Models\TenantTemplateOverride;
use App\Services\Pdf\PdfService;
use Illuminate\Support\Facades\Storage;

class HtmlTemplatePdfGenerator
{
    protected TenantBrandingService $brandingService;

    protected DocumentVerificationService $verificationService;

    protected PdfService $pdfService;

    public function __construct(
        TenantBrandingService $brandingService,
        DocumentVerificationService $verificationService,
        PdfService $pdfService
    ) {
        $this->brandingService = $brandingService;
        $this->verificationService = $verificationService;
        $this->pdfService = $pdfService;
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

        $pdfContent = $this->pdfService->renderHtml($html);

        $fileName = $customFileName ?? uniqid("{$documentType}-").'.pdf';

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

        return $this->pdfService->renderHtml($html);
    }

    protected function buildVerifyUrl(string $documentType, string $token): string
    {
        $routeMap = [
            'certificate' => 'certificates.verify',
            'credit_note' => 'verify.credit-note',
            'debit_note' => 'verify.debit-note',
            'invoice' => 'verify.invoice',
            'receipt' => 'verify.receipt',
            'broker_slip' => 'broker-slips.verify',
        ];

        $routeName = $routeMap[$documentType] ?? null;

        if ($routeName && \Illuminate\Support\Facades\Route::has($routeName)) {
            if ($documentType === 'broker_slip') {
                return route($routeName, ['brokerSlip' => $token]);
            }
            if ($documentType === 'certificate') {
                return route($routeName, ['certificateNumber' => $token]);
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

        if ($isPreview) {
            // Overwrite local file:/// paths with public browser-accessible URLs for live previews
            $branding['logo_path'] = $branding['logo_url'] ?? $branding['logo_path'];
            $branding['header_image_path'] = $branding['header_image_url'] ?? $branding['header_image_path'];
            $branding['footer_image_path'] = $branding['footer_image_url'] ?? $branding['footer_image_path'];
            $branding['signature_path'] = $branding['signature_url'] ?? $branding['signature_path'];
            $branding['stamp_path'] = $branding['stamp_url'] ?? $branding['stamp_path'];
        }

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

        // Convert preparer signature URL to local path and base64 fallback.
        // Reuse the branding signature if the path matches, avoiding a redundant encode.
        $signaturePath = $payload['preparer_signature'] ?? $payload['preparer_signature_url'] ?? null;
        if (! empty($signaturePath)) {
            $tenantSignature = $templateOverride?->signature ?? $tenant->signature;
            if ($signaturePath === $tenantSignature && ! empty($branding['signature_path'])) {
                $payload['preparer_signature_path'] = $branding['signature_path'];
                $payload['preparer_signature_base64'] = $branding['signature_base64'];
            } else {
                if ($isPreview) {
                    $payload['preparer_signature_path'] = $this->brandingService->imageToPublicUrl($signaturePath);
                } else {
                    $payload['preparer_signature_path'] = $this->brandingService->getOptimizedImageLocalPath($signaturePath, 'signature');
                }
                $payload['preparer_signature_base64'] = $this->brandingService->localPathToBase64($payload['preparer_signature_path']);
            }
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
