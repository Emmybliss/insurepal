<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreditNoteRequest;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\TenantDefaultTemplate;
use App\Services\CreditNoteService;
use App\Services\DocumentGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CreditNoteController extends Controller
{
    protected string $type = 'credit';

    protected string $routeNamePrefix = 'credit-notes';

    protected CreditNoteService $service;

    protected DocumentGenerationService $documentService;

    public function __construct(CreditNoteService $service, DocumentGenerationService $documentService)
    {
        $this->service = $service;
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        $data = $this->service->listNotes($request);

        return Inertia::render('credit-notes/Index', [
            'notes' => $data['notes'],
            'customers' => $data['customers'],
            'filters' => $request->only(['search', 'status', 'customer_id']),
            'stats' => $data['stats'],
        ]);
    }

    public function create(Request $request)
    {

        $lastCreditNote = CreditNote::withTrashed()->latest('id')->first();
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type', 'email']);
        $policies = collect();

        if ($request->filled('customer_id')) {
            $policies = Policy::where('customer_id', $request->customer_id)
                ->with('policyProduct')
                ->get();
        }

        return Inertia::render('credit-notes/Create', [
            'lastCreditNote' => $lastCreditNote,
            'customers' => $customers,
            'policies' => $policies,
            'selectedCustomer' => $request->customer_id,
            'type' => $this->type,
            'tenant_id' => Auth::user()->tenant_id,
        ]);
    }

    public function store(CreditNoteRequest $request)
    {
        $validated = $request->validated();
        try {
            $tenantId = Auth::user()->tenant_id;
            // Generate Credit Note Number
            $year = now()->year;
            // Generate Credit Note Number
            $lastCreditNote = CreditNote::withTrashed()->where('tenant_id', $tenantId)->latest('id')->first();
            $lastNumber = $lastCreditNote ? intval(substr($lastCreditNote->note_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
            $referenceNumber = sprintf('CN-%d-%d-%06d', $year, $tenantId, $newNumber);
            $note = CreditNote::create([
                'note_number' => $newNumber,
                'reference_number' => $referenceNumber,
                ...$validated,
                'created_by_id' => Auth::id(),
                'tenant_id' => Auth::user()->tenant_id,
            ]);

            return redirect()->route($this->routeNamePrefix.'.show', $note)
                ->with('success', 'Credit note created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating credit note: '.$e->getMessage());

            return back()->with('error', 'An error occurred while creating the credit note: '.$e->getMessage());
        }
    }

    public function storeFromPolicy(Request $request, Policy $policy)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'nullable|date|after_or_equal:today',
            'items' => 'nullable|array',
            'tenant_id' => Auth::user()->tenant_id,
        ]);

        if ($policy->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized access to policy.');
        }

        $this->service->createCreditNoteFromPolicy($policy, $request->all());

        return redirect()->route('policy-management.show', $policy)
            ->with('success', 'Credit note created successfully.');
    }

    public function show(CreditNote $creditNote)
    {
        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        // Get available templates for credit notes
        $registry = config('document-templates.templates', []);
        $templates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'credit_note');

        return Inertia::render('credit-notes/Show', [
            'note' => $creditNote,
            'templates' => $templates,
        ]);
    }

    public function edit(CreditNote $creditNote)
    {
        if ($creditNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $creditNote->load(['customer', 'policy']);
        $customers = Customer::active()->get();
        $policies = Policy::where('customer_id', $creditNote->customer_id)
            ->with('policyProduct')
            ->get();

        return Inertia::render('credit-notes/Edit', [
            'note' => $creditNote,
            'customers' => $customers,
            'policies' => $policies,
            'tenant_id' => Auth::user()->tenant_id,
        ]);
    }

    public function update(CreditNoteRequest $request, CreditNote $creditNote)
    {
        if ($creditNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $creditNote->update($request->validated());

        return redirect()->route($this->routeNamePrefix.'.show', $creditNote)
            ->with('success', 'Credit note updated successfully.');
    }

    public function destroy(CreditNote $creditNote)
    {
        if ($creditNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be deleted.');
        }

        $creditNote->delete();

        return redirect()->route($this->routeNamePrefix.'.index')
            ->with('success', 'Credit note deleted successfully.');
    }

    public function issueCreditNote(CreditNote $creditNote)
    {
        try {
            if (! in_array($creditNote->status, ['draft', 'generated'])) {
                return back()->with('error', 'Only draft or generated notes can be issued.');
            }

            $creditNote->update([
                'status' => 'issued',
                'issue_date' => now(),
            ]);

            return back()->with('success', 'Credit note issued successfully.');
        } catch (\Throwable $e) {
            Log::error('Error issuing credit note', [
                'credit_note_id' => $creditNote->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with(
                'error',
                'An error occurred while issuing the credit note. Please try again.'
            );
        }
    }

    public function markCreditNoteAsPaid(Request $request, CreditNote $creditNote)
    {
        // Authorization (policy or gate strongly recommended)
        $this->authorize('mark_credit_notes_paid', $creditNote);

        try {

            // Status guard
            if ($creditNote->status !== 'issued') {
                return back()->with('error', 'Only issued credit notes can be marked as paid.');
            }

            // Prevent double payment marking
            if ($creditNote->paid_at) {
                return back()->with('error', 'This credit note has already been marked as paid.');
            }

            $validated = $request->validate([
                'payment_date' => ['required', 'date', 'before_or_equal:today'],
                'payment_reference' => ['nullable', 'string', 'max:255'],
            ]);

            $creditNote->update([
                'status' => 'paid',
                'paid_at' => $validated['payment_date'],
                'metadata' => array_merge(
                    (array) $creditNote->metadata,
                    [
                        'payment_reference' => $validated['payment_reference'],
                        'marked_paid_by' => Auth::id(),
                        'marked_paid_at' => now(),
                    ]
                ),
            ]);

            return back()->with('success', 'Credit note marked as paid successfully.');
        } catch (\Throwable $th) {
            // throw $th;
        }
    }

    public function cancel(CreditNote $creditNote)
    {
        if ($creditNote->status === 'paid') {
            return back()->with('error', 'Paid notes cannot be cancelled.');
        }

        $creditNote->update(['status' => 'cancelled']);

        return back()->with('success', 'Credit note cancelled successfully.');
    }

    public function getCreditNoteGenerationOptions(Request $request, CreditNote $creditNote)
    {
        ini_set('memory_limit', '256M');

        Gate::authorize('generate_credit_notes', $creditNote);

        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($creditNote->tenant_id, 'credit_note')
            ?? 'credit_note.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        // Fetch existing active credit notes for the policy
        $existingCreditNotes = CreditNote::where('policy_id', $creditNote->policy_id)
            ->active()
            ->get(['id', 'type', 'status', 'note_number', 'generated_at']);

        // Generate QR/Barcode data for preview
        $tempCreditNoteNumber = CreditNote::generateCreditNoteNumber(
            $creditNote->tenant_id,
            'TEMP'
        );

        $qrBarcodeData = [
            'qr_code_policy' => url('/media/qrcode/'.urlencode($creditNote->policy?->policy_number ?? 'N/A')),
            'qr_code_credit_note' => url('/media/qrcode/'.urlencode($tempCreditNoteNumber)),
            'barcode_policy' => url('/media/barcode/'.urlencode($creditNote->policy?->policy_number ?? 'N/A')),
            'barcode_credit_note' => url('/media/barcode/'.urlencode($tempCreditNoteNumber)),
        ];

        // Return Inertia response
        return Inertia::render('credit-notes/GenerateCreditNote', [
            'creditNote' => $creditNote->load(['customer', 'policy.policyProduct', 'policy.policyType', 'policy.policyClass', 'createdBy', 'tenant']),
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
            'existing_credit_notes' => $existingCreditNotes,
            'available_types' => CreditNote::getAvailableTypes(),
            'regenerate_credit_note_id' => $request->get('regenerate_credit_note_id'),
            'qrBarcodeData' => $qrBarcodeData,
        ]);
    }

    /**
     * Generate credit note for policy
     */
    public function generateCreditNote(Request $request, CreditNote $creditNote)
    {
        Gate::authorize('generate_credit_notes', $creditNote);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(CreditNote::getAvailableTypes())),
            'options' => 'sometimes|array',
        ]);

        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'credit_note.classic');
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        $type = $request->input('type', 'standard');

        try {
            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapCreditNote($creditNote);
            $fileName = 'credit-note-'.uniqid().'.pdf';

            $result = $generator->generateAndStore(
                $creditNote->tenant,
                $templateKey,
                $payload,
                'credit-notes',
                $fileName
            );

            // Persist verification data
            $verificationService = app(\App\Services\Documents\DocumentVerificationService::class);
            $snapshot = $verificationService->computeSnapshot($payload);
            $documentHash = $verificationService->generateDocumentHash($snapshot);

            $metadata = $creditNote->metadata ?? [];
            $metadata['metadata'] = [
                'template_key' => $templateKey,
                'generation_options' => $request->options ?? [],
                'generated_at' => now()->toISOString(),
                'generated_by' => Auth::id(),
            ];

            $creditNote->update([
                'type' => $type,
                'status' => CreditNote::STATUS_GENERATED,
                'generated_at' => now(),
                'file_path' => $result['path'],
                'file_name' => $fileName,
                'file_size' => $result['file_size'],
                'file_hash' => $result['file_hash'],
                'metadata' => $metadata,
                'snapshot_json' => $snapshot,
                'document_hash' => $documentHash,
            ]);

            if (method_exists($creditNote, 'addToAuditTrail')) {
                $creditNote->addToAuditTrail(
                    'generated',
                    'Credit note generated',
                    'Template: '.$templateKey
                );
            }

            return redirect()
                ->route('credit-notes.show', $creditNote)
                ->with('success', 'Credit note generated and saved successfully as PDF.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to generate credit note: '.$e->getMessage());
        }
    }

    /**
     * Regenerate existing credit note
     */
    public function regenerateCreditNote(Request $request, CreditNote $creditNote)
    {
        set_time_limit(120);

        Gate::authorize('regenerate_credit_notes', $creditNote);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(CreditNote::getAvailableTypes())),
            'options' => 'sometimes|array',
        ]);

        try {
            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'credit_note.classic');
            $template = $registry[$templateKey] ?? null;

            if (! $template) {
                return back()->with('error', "Template '{$templateKey}' not found.");
            }

            $type = $request->type ?: 'credit_note';

            if ($creditNote->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($creditNote->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($creditNote->file_path);
            }

            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapCreditNote($creditNote);
            $fileName = 'credit-note-'.uniqid().'.pdf';

            $result = $generator->generateAndStore(
                $creditNote->tenant,
                $templateKey,
                $payload,
                'credit-notes',
                $fileName
            );

            // Persist verification data
            $verificationService = app(\App\Services\Documents\DocumentVerificationService::class);
            $snapshot = $verificationService->computeSnapshot($payload);
            $documentHash = $verificationService->generateDocumentHash($snapshot);

            $creditNote->update([
                'type' => $type,
                'status' => CreditNote::STATUS_GENERATED,
                'file_path' => $result['path'],
                'file_name' => $fileName,
                'file_size' => $result['file_size'],
                'file_hash' => $result['file_hash'],
                'snapshot_json' => $snapshot,
                'document_hash' => $documentHash,
                'metadata' => [
                    'template_key' => $templateKey,
                    'generation_options' => $request->options ?? [],
                    'regenerated_at' => now()->toISOString(),
                    'regenerated_by' => Auth::id(),
                ],
            ]);

            $creditNote->addToAuditTrail(
                'regenerated',
                'Credit note regenerated with new PDF',
                'Template: '.$templateKey
            );

            return redirect()
                ->route('credit-notes.show', $creditNote)
                ->with('success', 'Credit note regenerated successfully.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to regenerate credit note: '.$e->getMessage());
        }
    }

    /**
     * Download credit note PDF
     */
    public function downloadCreditNotePdf(CreditNote $creditNote)
    {
        Gate::authorize('download_credit_notes', $creditNote);

        try {
            // Check if PDF file exists
            if (! $creditNote->file_path || ! Storage::disk('public')->exists($creditNote->file_path)) {
                return back()->with('error', 'Credit note PDF file not found.');
            }

            // Log download activity
            if (method_exists($creditNote, 'addToAuditTrail')) {
                $creditNote->addToAuditTrail(
                    'downloaded',
                    'Credit note downloaded by '.Auth::user()->name
                );
            }

            return response()->download(
                Storage::disk('public')->path($creditNote->file_path),
                $creditNote->file_name ?? "credit-note-{$creditNote->note_number}.pdf"
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download certificate: '.$e->getMessage());
        }
    }

    /**
     * Preview credit note in browser
     */
    public function previewCreditNote(CreditNote $creditNote)
    {
        Gate::authorize('view_credit_notes', $creditNote);

        try {
            // Check if PDF file exists
            if (! $creditNote->file_path || ! Storage::disk('public')->exists($creditNote->file_path)) {
                return back()->with('error', 'Credit note PDF file not found.');
            }

            // Set headers for PDF preview in browser
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.($creditNote->file_name ?? "credit-note-{$creditNote->note_number}.pdf").'"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ];

            // Log preview activity
            if (method_exists($creditNote, 'addToAuditTrail')) {
                $creditNote->addToAuditTrail(
                    'previewed',
                    'Credit note previewed by '.Auth::user()->name
                );
            }

            return new Response(Storage::disk('public')->get($creditNote->file_path), 200, $headers);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to preview Credit note: '.$e->getMessage());
        }
    }

    public function getPoliciesByCustomer(Request $request)
    {
        $policies = $this->service->getPoliciesByCustomer($request);

        return response()->json($policies);
    }

    public function bulkAction(Request $request)
    {
        $processed = $this->service->bulkAction($request);

        $action = ucfirst($request->action);

        return back()->with('success', "{$action} action completed for {$processed} notes.");
    }

    /**
     * Render the credit note Blade view as inline HTML for iframe preview.
     */
    public function htmlPreview(Request $request, CreditNote $creditNote)
    {
        Gate::authorize('view_credit_notes', $creditNote);

        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'credit_note.classic');
        $template = $registry[$templateKey] ?? null;

        if ($template) {
            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapCreditNote($creditNote);

            try {
                $html = $generator->renderHtml(
                    $creditNote->tenant,
                    $templateKey,
                    $payload,
                    $template['css_overrides'] ?? [],
                    $template['label_overrides'] ?? [],
                    true
                );

                return response($html);
            } catch (\Exception $e) {
                Log::error('HTML Preview Error: '.$e->getMessage());
            }
        }

        return response()->view('credit-notes.pdf', compact('creditNote'));
    }

    /**
     * Generate and stream a PDF of the credit note using the Blade template.
     */
    public function downloadPdf(CreditNote $creditNote)
    {
        Gate::authorize('download_credit_notes', $creditNote);

        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('credit-notes.pdf', compact('creditNote'));

        return $pdf->download("credit-note-{$creditNote->note_number}.pdf");
    }
}
