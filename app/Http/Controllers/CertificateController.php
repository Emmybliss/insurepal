<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Models\PolicyCertificate;
use App\Services\CertificateDesignEngine;
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

    protected CertificateDesignEngine $designEngine;

    public function __construct(
        CertificateGenerationService $certificateService,
        CertificateDesignEngine $designEngine
    ) {
        $this->certificateService = $certificateService;
        $this->designEngine = $designEngine;

        $this->middleware('tenant.type:underwriter')->except(['verify']);
    }

    /**
     * Display listing of certificates
     */
    public function index(Request $request)
    {
        Gate::authorize('view_certificates');

        $query = PolicyCertificate::with(['policy.customer', 'policy.policyProduct'])
            ->forTenant(Auth::user()->tenant_id);

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
                        $pq->where('policy_number', 'like', "%{$search}%");
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
    public function generate(Request $request, Policy $policy)
    {
        Gate::authorize('generate_certificates', $policy);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(PolicyCertificate::getAvailableTypes())),
            'options' => 'sometimes|array',
            'certificate_pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'certificate.classic');
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        $type = $request->type ?: 'policy_certificate';

        try {
            $file = $request->file('certificate_pdf');
            $fileName = 'certificate-'.uniqid().'.'.$file->getClientOriginalExtension();
            $pdfPath = $file->storeAs("certificates/{$policy->tenant_id}/pdfs", $fileName, 'public');

            $certificate = PolicyCertificate::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'certificate_number' => PolicyCertificate::generateCertificateNumber(
                    $policy->tenant_id,
                    strtoupper(substr($type, 0, 4))
                ),
                'type' => $type,
                'status' => PolicyCertificate::STATUS_GENERATED,
                'file_path' => $pdfPath,
                'file_name' => $fileName,
                'file_size' => $file->getSize(),
                'file_hash' => hash_file('sha256', $file->getPathname()),
                'generated_at' => now(),
                'generated_by' => Auth::id(),
                'generation_metadata' => [
                    'template_key' => $templateKey,
                    'generation_options' => $request->options ?? [],
                    'generated_at' => now()->toISOString(),
                    'generated_by' => Auth::id(),
                ],
                'certificate_data' => $this->prepareCertificateData($policy, $templateKey),
            ]);

            $certificate->addToAuditTrail(
                'generated',
                'Certificate generated',
                'Template: '.$templateKey
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
    public function regenerate(Request $request, PolicyCertificate $certificate)
    {
        set_time_limit(120);

        Gate::authorize('regenerate_certificate', $certificate);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(PolicyCertificate::getAvailableTypes())),
            'options' => 'sometimes|array',
            'certificate_pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        try {
            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'certificate.classic');
            $template = $registry[$templateKey] ?? null;

            if (! $template) {
                return back()->with('error', "Template '{$templateKey}' not found.");
            }

            $type = $request->type ?: 'policy_certificate';

            if ($certificate->file_path && Storage::disk('public')->exists($certificate->file_path)) {
                Storage::disk('public')->delete($certificate->file_path);
            }

            $file = $request->file('certificate_pdf');
            $fileName = 'certificate-'.uniqid().'.'.$file->getClientOriginalExtension();
            $pdfPath = $file->storeAs("certificates/{$certificate->tenant_id}/pdfs", $fileName, 'public');

            $certificate->update([
                'type' => $type,
                'file_path' => $pdfPath,
                'file_name' => $fileName,
                'file_size' => $file->getSize(),
                'file_hash' => hash_file('sha256', $file->getPathname()),
                'generation_metadata' => [
                    'template_key' => $templateKey,
                    'generation_options' => $request->options ?? [],
                    'regenerated_at' => now()->toISOString(),
                    'regenerated_by' => Auth::id(),
                ],
            ]);

            $certificate->addToAuditTrail(
                'regenerated',
                'Certificate regenerated with new PDF',
                'Template: '.$templateKey
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
        ]);

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
        ]);

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
                'policy_number' => $certificate->policy->policy_number,
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
        // Temporarily increase memory limit for complex certificate operations
        ini_set('memory_limit', '256M');

        Gate::authorize('generate_certificates', $policy);

        // Fetch active document templates for certificates
        $registry = config('document-templates.templates', []);
        $certTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'certificate');

        $templates = array_map(fn ($key, $template) => [
            'key' => $key,
            'name' => $template['name'] ?? $key,
            'type' => $template['type'] ?? 'certificate',
            'category' => $template['category'] ?? 'standard',
            'description' => $template['description'] ?? '',
        ], array_keys($certTemplates), $certTemplates);

        // Fetch existing active certificates for the policy
        $existingCertificates = PolicyCertificate::where('policy_id', $policy->id)
            ->active()
            ->get(['id', 'type', 'status', 'certificate_number', 'generated_at']);

        // Generate QR/Barcode data for preview
        $tempCertificateNumber = PolicyCertificate::generateCertificateNumber(
            $policy->tenant_id,
            'TEMP'
        );

        $qrBarcodeData = [
            'qr_code_policy' => url('/media/qrcode/'.urlencode($policy->policy_number)),
            'qr_code_certificate' => url('/media/qrcode/'.urlencode($tempCertificateNumber)),
            'barcode_policy' => url('/media/barcode/'.urlencode($policy->policy_number)),
            'barcode_certificate' => url('/media/barcode/'.urlencode($tempCertificateNumber)),
        ];

        // Return Inertia response
        return Inertia::render('certificates/Generate', [
            'policy' => $policy->load(['customer', 'policyProduct', 'tenant', 'policyType', 'policyClass']),
            'templates' => $templates,
            'existing_certificates' => $existingCertificates,
            'available_types' => PolicyCertificate::getAvailableTypes(),
            'regenerate_certificate_id' => $request->get('regenerate_certificate_id'),
            'qrBarcodeData' => $qrBarcodeData,
        ]);
    }

    /**
     * Bulk generate certificates
     */
    public function bulkGenerate(Request $request)
    {
        Gate::authorize('bulk_generate_certificates');

        $request->validate([
            'policy_ids' => 'required|array',
            'policy_ids.*' => 'exists:policies,id',
            'template_ids' => 'required|array',
            'template_ids.*' => 'exists:document_templates,id',
            'options' => 'sometimes|array',
        ]);

        $results = [];
        $successCount = 0;
        $errorCount = 0;

        foreach ($request->policy_ids as $policyId) {
            try {
                $policy = Policy::findOrFail($policyId);
                Gate::authorize('generate_certificates', $policy);

                $certificates = $this->certificateService->generateMultipleCertificates(
                    $policy,
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
     * Prepare certificate data for storage
     */
    protected function prepareCertificateData(Policy $policy, string $templateKey): array
    {
        $customer = $policy->customer;
        $product = $policy->policyProduct;
        $certificateNumber = PolicyCertificate::generateCertificateNumber(
            $policy->tenant_id,
            strtoupper(substr('policy_certificate', 0, 4))
        );

        $registry = config('document-templates.templates', []);
        $template = $registry[$templateKey] ?? [];

        $qrCodePolicy = url('/media/qrcode/'.urlencode($policy->policy_number));
        $qrCodeCertificate = url('/media/qrcode/'.urlencode($certificateNumber));
        $barcodePolicy = url('/media/barcode/'.urlencode($policy->policy_number));
        $barcodeCertificate = url('/media/barcode/'.urlencode($certificateNumber));

        return [
            'certificate_number' => $certificateNumber,
            'generation_date' => now()->format('d/m/Y'),
            'generation_time' => now()->format('H:i:s'),
            'policy_number' => $policy->policy_number,
            'policy_status' => $policy->status,
            'effective_date' => $policy->effective_date,
            'expiry_date' => $policy->expiry_date,
            'premium_amount' => $policy->premium_amount,
            'total_amount' => $policy->total_amount,
            'payment_frequency' => $policy->payment_frequency,
            'coverage_details' => $policy->coverage_details,
            'form_data' => $policy->form_data,
            'customer_name' => $this->getCustomerName($customer),
            'customer_type' => $customer->type,
            'customer_email' => $customer->email,
            'customer_phone' => $customer->phone,
            'customer_address' => $this->getCustomerAddress($customer),
            'product_name' => $product->name,
            'product_description' => $product->description,
            'product_category' => $product->category,
            'company_name' => $policy->tenant->name,
            'company_address' => $policy->tenant->address,
            'company_phone' => $policy->tenant->phone,
            'company_email' => $policy->tenant->email,
            'qr_code_policy' => $qrCodePolicy,
            'qr_code_certificate' => $qrCodeCertificate,
            'barcode_policy' => $barcodePolicy,
            'barcode_certificate' => $barcodeCertificate,
            'template_name' => $template['name'] ?? $templateKey,
            'template_type' => $template['type'] ?? 'certificate',
        ];
    }

    /**
     * Get customer name for display
     */
    protected function getCustomerName($customer): string
    {
        if ($customer->type === 'corporate') {
            return $customer->company_name ?: ($customer->first_name.' '.$customer->last_name);
        }

        return $customer->first_name.' '.$customer->last_name;
    }

    /**
     * Get customer address for display
     */
    protected function getCustomerAddress($customer): string
    {
        $address = [];

        if ($customer->address) {
            $address[] = $customer->address;
        }
        if ($customer->city) {
            $address[] = $customer->city;
        }
        if ($customer->state) {
            $address[] = $customer->state;
        }
        if ($customer->country) {
            $address[] = $customer->country;
        }

        return implode(', ', $address);
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
                <img src='file://{$fullImagePath}' alt='Certificate' />
            </body>
            </html>";

            // Generate PDF using DomPDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'enable_php' => false,
                    'enable_javascript' => false,
                    'enable_remote' => true,
                    'isPhpEnabled' => false,
                    'isJavascriptEnabled' => false,
                    'isRemoteEnabled' => true,
                ]);

            // Log download activity
            $certificate->addToAuditTrail(
                'downloaded',
                'Certificate downloaded by '.Auth::user()->name
            );

            $fileName = "certificate-{$certificate->certificate_number}.pdf";

            return $pdf->download($fileName);
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
