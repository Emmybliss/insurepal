<?php

namespace App\Http\Controllers;

use App\Http\Requests\CertificateActionRequest;
use App\Http\Requests\StoreCertificateRequest;
use App\Http\Requests\UpdateCertificateRequest;
use App\Models\Policy;
use App\Models\PolicyCertificate;
use App\Services\CertificateGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateController extends Controller
{
    protected CertificateGenerationService $certificateService;

    protected \App\Services\Pdf\PdfService $pdfService;

    public function __construct(
        CertificateGenerationService $certificateService,
        \App\Services\Pdf\PdfService $pdfService,
    ) {
        $this->certificateService = $certificateService;
        $this->pdfService = $pdfService;

        $this->middleware('tenant.type:underwriter')->except(['verify']);
    }

    /**
     * Display listing of certificates
     */
    public function index(Request $request)
    {
        Gate::authorize('view_certificates');

        $query = PolicyCertificate::with(['policy.customer', 'policy.policyProduct'])
            ->forTenant($request->user()->tenant_id);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('policy_id')) {
            $query->where('policy_id', $request->policy_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('certificate_number', 'like', "%{$search}%")
                    ->orWhereHas('policy', function ($pq) use ($search) {
                        $pq->where('policy_number', 'like', "%{$search}%")
                            ->orWhere('internal_reference', 'like', "%{$search}%");
                    })
                    ->orWhereHas('policy.customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        $certificates = $query->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('certificates/Index', [
            'certificates' => $certificates,
            'filters' => $request->only(['status', 'type', 'policy_id', 'search']),
            'statuses' => PolicyCertificate::getAvailableStatuses(),
            'types' => PolicyCertificate::getAvailableTypes(),
        ]);
    }

    /**
     * Show certificate details
     */
    public function show(PolicyCertificate $certificate)
    {
        Gate::authorize('view_certificate', $certificate);

        $certificate->load(['policy.customer', 'policy.policyProduct', 'generator', 'issuer']);

        return Inertia::render('certificates/Show', [
            'certificate' => $certificate,
        ]);
    }

    /**
     * Generate certificate for policy
     */
    public function generate(StoreCertificateRequest $request, Policy $policy)
    {
        Gate::authorize('generate_certificates', $policy);

        $request->validated();

        $templateKey = $request->input('template_key', 'certificate.classic');

        if (! $this->certificateService->resolveTemplate($templateKey)) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        try {
            $certificate = $this->certificateService->generate(
                $policy,
                $request->user(),
                $request->only(['type', 'options']),
                $request->file('certificate_pdf'),
                $templateKey
            );

            return redirect()
                ->route('certificates.show', $certificate)
                ->with('success', 'Certificate generated and saved successfully as PDF.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to generate certificate: '.$e->getMessage());
        }
    }

    /**
     * Regenerate existing certificate
     */
    public function regenerate(UpdateCertificateRequest $request, PolicyCertificate $certificate)
    {
        set_time_limit(120);

        Gate::authorize('regenerate_certificate', $certificate);

        $request->validated();

        try {
            $templateKey = $request->input('template_key', 'certificate.classic');

            if (! $this->certificateService->resolveTemplate($templateKey)) {
                return back()->with('error', "Template '{$templateKey}' not found.");
            }

            $certificate = $this->certificateService->regenerate(
                $certificate,
                $request->user(),
                $request->only(['type', 'options']),
                $request->file('certificate_pdf'),
                $templateKey
            );

            return redirect()
                ->route('certificates.show', $certificate)
                ->with('success', 'Certificate regenerated successfully.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to regenerate certificate: '.$e->getMessage());
        }
    }

    /**
     * Download certificate PDF
     */
    public function download(PolicyCertificate $certificate)
    {
        Gate::authorize('download_certificate', $certificate);

        try {
            // Check if PDF file exists
            if (! $certificate->file_path || ! Storage::disk('public')->exists($certificate->file_path)) {
                return back()->with('error', 'Certificate PDF file not found.');
            }

            // Log download activity
            $certificate->addToAuditTrail(
                'downloaded',
                'Certificate downloaded by '.Auth::user()->name
            );

            // Download the PDF file
            return response()->download(
                Storage::disk('public')->path($certificate->file_path),
                $certificate->file_name ?: "certificate-{$certificate->certificate_number}.pdf"
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download certificate: '.$e->getMessage());
        }
    }

    /**
     * Preview certificate in browser
     */
    public function preview(PolicyCertificate $certificate)
    {
        Gate::authorize('view_certificate', $certificate);

        try {
            // Check if PDF file exists
            if (! $certificate->file_path || ! Storage::disk('public')->exists($certificate->file_path)) {
                return back()->with('error', 'Certificate PDF file not found.');
            }

            // Set headers for PDF preview in browser
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.($certificate->file_name ?: "certificate-{$certificate->certificate_number}.pdf").'"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ];

            // Log preview activity
            $certificate->addToAuditTrail(
                'previewed',
                'Certificate previewed by '.Auth::user()->name
            );

            return new Response(Storage::disk('public')->get($certificate->file_path), 200, $headers);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to preview certificate: '.$e->getMessage());
        }
    }

    /**
     * Issue certificate to customer
     */
    public function issue(Request $request, PolicyCertificate $certificate)
    {
        Gate::authorize('issue_certificate', $certificate);

        $request->validate([
            'notes' => 'sometimes|string|max:1000',
        ]); // single field — leave inline

        if (! $certificate->canBeIssued()) {
            return back()->with('error', 'Certificate cannot be issued in current status.');
        }

        $certificate->markAsIssued($request->notes);

        return back()->with('success', 'Certificate issued successfully.');
    }

    /**
     * Cancel certificate
     */
    public function cancel(Request $request, PolicyCertificate $certificate)
    {
        Gate::authorize('cancel_certificate', $certificate);

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]); // single field — leave inline

        if (! $certificate->canBeCancelled()) {
            return back()->with('error', 'Certificate cannot be cancelled in current status.');
        }

        $certificate->markAsCancelled($request->reason);

        return back()->with('success', 'Certificate cancelled successfully.');
    }

    /**
     * Verify certificate by number
     */
    public function verify(string $certificateNumber)
    {
        $certificate = PolicyCertificate::where('certificate_number', $certificateNumber)
            ->with(['policy.customer', 'policy.policyProduct', 'policy.tenant'])
            ->first();

        if (! $certificate) {
            return Inertia::render('certificates/Verify', [
                'certificate' => null,
                'error' => 'Certificate not found.',
            ]);
        }

        // Log verification attempt
        $certificate->addToAuditTrail(
            'verified',
            'Certificate verified by public user',
            'IP: '.request()->ip()
        );

        // Return limited public information
        $publicData = [
            'certificate_number' => $certificate->certificate_number,
            'type' => $certificate->type,
            'status' => $certificate->status,
            'issued_at' => $certificate->issued_at,
            'expires_at' => $certificate->expires_at,
            'policy' => [
                'policy_number' => $certificate->policy->policy_number_display,
                'effective_date' => $certificate->policy->effective_date,
                'expiry_date' => $certificate->policy->expiry_date,
                'status' => $certificate->policy->status,
                'product_name' => $certificate->policy->policyProduct->name,
            ],
            'customer' => [
                'name' => $certificate->policy->customer->type === 'corporate'
                    ? $certificate->policy->customer->company_name
                    : $certificate->policy->customer->first_name.' '.$certificate->policy->customer->last_name,
                'type' => $certificate->policy->customer->type,
            ],
            'company' => [
                'name' => $certificate->policy->tenant->name,
                'address' => $certificate->policy->tenant->address,
            ],
        ];

        return Inertia::render('certificates/Verify', [
            'certificate' => $publicData,
            'error' => null,
        ]);
    }

    /**
     * Get certificate generation options for policy
     */
    public function getGenerationOptions(Request $request, Policy $policy)
    {
        ini_set('memory_limit', '256M');

        Gate::authorize('generate_certificates', $policy);

        $existingCertificates = PolicyCertificate::where('policy_id', $policy->id)
            ->active()
            ->get(['id', 'type', 'status', 'certificate_number', 'generated_at']);

        $tempCertificateNumber = PolicyCertificate::generateCertificateNumber(
            $policy->tenant_id,
            'TEMP'
        );

        return Inertia::render('certificates/Generate', [
            'policy' => $policy->load(['customer', 'policyProduct', 'tenant', 'policyType', 'policyClass']),
            'templates' => $this->certificateService->getAvailableTemplates(),
            'existing_certificates' => $existingCertificates,
            'available_types' => PolicyCertificate::getAvailableTypes(),
            'regenerate_certificate_id' => $request->get('regenerate_certificate_id'),
            'qrBarcodeData' => $this->certificateService->generateQrBarcodeData($policy, $tempCertificateNumber),
        ]);
    }

    /**
     * Bulk generate certificates
     */
    public function bulkGenerate(CertificateActionRequest $request)
    {
        Gate::authorize('bulk_generate_certificates');

        $request->validated();

        $results = [];
        $successCount = 0;
        $errorCount = 0;

        foreach ($request->policy_ids as $policyId) {
            try {
                $policy = Policy::findOrFail($policyId);
                Gate::authorize('generate_certificates', $policy);

                $certificates = $this->certificateService->generateMultipleCertificates(
                    $policy,
                    $request->user(),
                    $request->template_ids,
                    $request->options ?? []
                );

                $results[$policyId] = [
                    'status' => 'success',
                    'certificates' => $certificates,
                    'message' => count($certificates).' certificate(s) generated successfully.',
                ];

                $successCount += count($certificates);
            } catch (\Exception $e) {
                $results[$policyId] = [
                    'status' => 'error',
                    'message' => $e->getMessage(),
                ];
                $errorCount++;
            }
        }

        $message = "Bulk generation completed. {$successCount} certificates generated successfully.";
        if ($errorCount > 0) {
            $message .= " {$errorCount} policies failed.";
        }

        return back()->with('success', $message)->with('bulk_results', $results);
    }

    /**
     * Download certificate image as PDF
     */
    protected function downloadImageAsPdf(PolicyCertificate $certificate)
    {
        // Check if certificate has an image
        if ($certificate->hasCertificateImage()) {
            $imagePath = $certificate->certificate_image_path;
            $fullImagePath = Storage::disk('public')->path($imagePath);

            $mime = mime_content_type($fullImagePath);
            $base64 = base64_encode(file_get_contents($fullImagePath));
            $dataUrl = 'data:'.$mime.';base64,'.$base64;

            // Create HTML with the image
            $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Certificate - {$certificate->certificate_number}</title>
                <style>
                    body { margin: 0; padding: 0; }
                    img { width: 100%; height: auto; display: block; }
                </style>
            </head>
            <body>
                <img src='{$dataUrl}' alt='Certificate' />
            </body>
            </html>";

            // Generate PDF using Browsershot
            $pdfContent = $this->pdfService->renderHtml($html);

            // Log download activity
            $certificate->addToAuditTrail(
                'downloaded',
                'Certificate downloaded by '.Auth::user()->name
            );

            $fileName = "certificate-{$certificate->certificate_number}.pdf";

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            ]);
        }

        // Fallback: If no image but PDF exists, download the existing PDF
        if ($certificate->file_path && Storage::disk('public')->exists($certificate->file_path)) {
            // Log download activity
            $certificate->addToAuditTrail(
                'downloaded',
                'Certificate downloaded by '.Auth::user()->name
            );

            return response()->download(
                Storage::disk('public')->path($certificate->file_path),
                $certificate->file_name ?: "certificate-{$certificate->certificate_number}.pdf"
            );
        }

        // If neither image nor PDF exists, return error
        return back()->with('error', 'Certificate file not found.');
    }
}
