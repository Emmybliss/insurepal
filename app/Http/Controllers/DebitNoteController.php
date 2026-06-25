<?php

namespace App\Http\Controllers;

use App\Http\Requests\DebitNoteRequest;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\TenantDefaultTemplate;
use App\Services\DebitNoteService;
use App\Services\DocumentGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DebitNoteController extends Controller
{
    protected string $type = 'debit';

    protected string $routeNamePrefix = 'debit-notes';

    protected DebitNoteService $service;

    protected DocumentGenerationService $documentService;

    public function __construct(DebitNoteService $service, DocumentGenerationService $documentService)
    {
        $this->service = $service;
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        $data = $this->service->listNotes($request);

        return Inertia::render('debit-notes/Index', [
            'notes' => $data['notes'],
            'customers' => $data['customers'],
            'filters' => $request->only(['search', 'status', 'customer_id']),
            'stats' => $data['stats'],
        ]);
    }

    public function create(Request $request)
    {

        $lastDebitNote = DebitNote::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
        //  Generate Debit Note Number
        $lastNumber = $lastDebitNote ? intval(substr($lastDebitNote->note_number, -6)) : 0;
        $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->active()
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type', 'email']);
        $policies = collect();

        if ($request->filled('customer_id')) {
            $policies = Policy::where('customer_id', $request->customer_id)
                ->with('policyProduct')
                ->get();
        }

        return Inertia::render('debit-notes/Create', [
            'lastDebitNote' => $newNumber,
            'customers' => $customers,
            'policies' => $policies,
            'selectedCustomer' => $request->customer_id,
            'type' => $this->type,
            'tenant_id' => Auth::user()->tenant_id,
        ]);
    }

    public function store(DebitNoteRequest $request)
    {
        $validated = $request->validated();
        try {
            // Generate Debit Note Number
            $lastDebitNote = DebitNote::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
            $lastNumber = $lastDebitNote ? intval(substr($lastDebitNote->note_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

            $lastSequence = DebitNote::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
            $sequenceNumber = $lastSequence ? $lastSequence->sequence_number + 1 : 1;

            $note = DebitNote::create([
                'note_number' => $newNumber,
                'sequence_number' => $sequenceNumber,
                ...$validated,
                'created_by_id' => Auth::id(),
                'tenant_id' => Auth::user()->tenant_id,
            ]);

            return redirect()->route($this->routeNamePrefix.'.show', $note)
                ->with('success', 'Debit note created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating debit note: '.$e->getMessage());

            return back()->with('error', 'An error occurred while creating the debit note: '.$e->getMessage());
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

        $this->service->createDebitNoteFromPolicy($policy, $request->all());

        return redirect()->route('policy-management.show', $policy)
            ->with('success', 'Debit Note created successfully.');
    }

    public function show(DebitNote $debitNote)
    {
        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $templates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'debit_note');

        return Inertia::render('debit-notes/Show', [
            'note' => $debitNote,
            'templates' => $templates,
        ]);
    }

    public function edit(DebitNote $debitNote)
    {
        if ($debitNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $debitNote->load(['customer', 'policy']);
        $customers = Customer::active()->get();
        $policies = Policy::where('customer_id', $debitNote->customer_id)
            ->with('policyProduct')
            ->get();

        return Inertia::render('debit-notes/Edit', [
            'note' => $debitNote,
            'customers' => $customers,
            'policies' => $policies,
            'tenant_id' => Auth::user()->tenant_id,
        ]);
    }

    public function update(DebitNoteRequest $request, DebitNote $debitNote)
    {
        if ($debitNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $debitNote->update($request->validated());

        return redirect()->route($this->routeNamePrefix.'.show', $debitNote)
            ->with('success', 'Debit note updated successfully.');
    }

    public function destroy(DebitNote $debitNote)
    {
        if ($debitNote->status !== 'draft') {
            return back()->with('error', 'Only draft notes can be deleted.');
        }

        $debitNote->delete();

        return redirect()->route($this->routeNamePrefix.'.index')
            ->with('success', 'Debit note deleted successfully.');
    }

    public function issueDebitNote(DebitNote $debitNote)
    {
        try {
            if (! in_array($debitNote->status, ['draft', 'generated'])) {
                return back()->with('error', 'Only draft or generated notes can be issued.');
            }

            $debitNote->update([
                'status' => 'issued',
                'issue_date' => now(),
            ]);

            return back()->with('success', 'Debit note issued successfully.');
        } catch (\Throwable $e) {
            Log::error('Error issuing debit note', [
                'debit_note_id' => $debitNote->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with(
                'error',
                'An error occurred while issuing the debit note. Please try again.'
            );
        }
    }

    public function markDebitNoteAsPaid(Request $request, DebitNote $debitNote)
    {
        // Authorization (policy or gate strongly recommended)
        $this->authorize('mark_debit_notes_paid', $debitNote);

        try {

            // Status guard
            if ($debitNote->status !== 'issued') {
                return back()->with('error', 'Only issued debit notes can be marked as paid.');
            }

            // Prevent double payment marking
            if ($debitNote->paid_at) {
                return back()->with('error', 'This debit note has already been marked as paid.');
            }

            $validated = $request->validate([
                'payment_date' => ['required', 'date', 'before_or_equal:today'],
                'payment_reference' => ['nullable', 'string', 'max:255'],
            ]);

            $debitNote->update([
                'status' => 'paid',
                'paid_at' => $validated['payment_date'],
                'metadata' => array_merge(
                    (array) $debitNote->metadata,
                    [
                        'payment_reference' => $validated['payment_reference'],
                        'marked_paid_by' => Auth::id(),
                        'marked_paid_at' => now(),
                    ]
                ),
            ]);

            return back()->with('success', 'Debit note marked as paid successfully.');
        } catch (\Throwable $th) {
            // throw $th;
        }
    }

    public function cancel(DebitNote $debitNote)
    {
        if ($debitNote->status === 'paid') {
            return back()->with('error', 'Paid notes cannot be cancelled.');
        }

        $debitNote->update(['status' => 'cancelled']);

        return back()->with('success', 'Debit note cancelled successfully.');
    }

    public function getDebitNoteGenerationOptions(Request $request, DebitNote $debitNote)
    {
        ini_set('memory_limit', '256M');

        Gate::authorize('generate_debit_notes', $debitNote);

        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($debitNote->tenant_id, 'debit_note')
            ?? 'debit_note.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        // Fetch existing active debit notes for the policy
        $existingDebitNotes = DebitNote::where('policy_id', $debitNote->policy_id)
            ->active()
            ->get(['id', 'type', 'status', 'note_number', 'generated_at']);

        // Generate QR/Barcode data for preview
        $tempDebitNoteNumber = DebitNote::generateDebitNoteNumber(
            $debitNote->tenant_id,
            'TEMP'
        );

        $qrBarcodeData = [
            'qr_code_policy' => url('/media/qrcode/'.urlencode($debitNote->policy?->policy_number ?? 'N/A')),
            'qr_code_debit_note' => url('/media/qrcode/'.urlencode($tempDebitNoteNumber)),
            'barcode_policy' => url('/media/barcode/'.urlencode($debitNote->policy?->policy_number ?? 'N/A')),
            'barcode_debit_note' => url('/media/barcode/'.urlencode($tempDebitNoteNumber)),
        ];

        // Return Inertia response
        return Inertia::render('debit-notes/GenerateDebitNote', [
            'debitNote' => $debitNote->load(['customer', 'policy.policyProduct', 'policy.policyType', 'policy.policyClass', 'createdBy', 'tenant']),
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
            'existing_debit_notes' => $existingDebitNotes,
            'available_types' => DebitNote::getAvailableTypes(),
            'regenerate_debit_note_id' => $request->get('regenerate_debit_note_id'),
            'qrBarcodeData' => $qrBarcodeData,
        ]);
    }

    /**
     * Generate debit note for policy
     */
    public function generateDebitNote(Request $request, DebitNote $debitNote)
    {
        Gate::authorize('generate_debit_notes', $debitNote);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(DebitNote::getAvailableTypes())),
            'options' => 'sometimes|array',
        ]);

        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'debit_note.classic');
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        $type = $request->input('type', 'standard');

        try {
            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapDebitNote($debitNote);
            $fileName = 'debit-note-'.uniqid().'.pdf';

            $result = $generator->generateAndStore(
                $debitNote->tenant,
                $templateKey,
                $payload,
                'debit-notes',
                $fileName
            );

            // Persist verification data
            $verificationService = app(\App\Services\Documents\DocumentVerificationService::class);
            $snapshot = $verificationService->computeSnapshot($payload);
            $documentHash = $verificationService->generateDocumentHash($snapshot);

            $metadata = $debitNote->metadata ?? [];
            $metadata['metadata'] = [
                'template_key' => $templateKey,
                'generation_options' => $request->options ?? [],
                'generated_at' => now()->toISOString(),
                'generated_by' => Auth::id(),
            ];

            $debitNote->update([
                'type' => $type,
                'status' => DebitNote::STATUS_GENERATED,
                'generated_at' => now(),
                'file_path' => $result['path'],
                'file_name' => $fileName,
                'file_size' => $result['file_size'],
                'file_hash' => $result['file_hash'],
                'metadata' => $metadata,
                'snapshot_json' => $snapshot,
                'document_hash' => $documentHash,
            ]);

            if (method_exists($debitNote, 'addToAuditTrail')) {
                $debitNote->addToAuditTrail(
                    'generated',
                    'Debit note generated',
                    'Template: '.$templateKey
                );
            }

            return redirect()
                ->route('debit-notes.show', $debitNote)
                ->with('success', 'Debit note generated and saved successfully as PDF.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to generate debit note: '.$e->getMessage());
        }
    }

    /**
     * Regenerate existing debit note
     */
    public function regenerateDebitNote(Request $request, DebitNote $debitNote)
    {
        set_time_limit(120);

        Gate::authorize('regenerate_debit_notes', $debitNote);

        $request->validate([
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(DebitNote::getAvailableTypes())),
            'options' => 'sometimes|array',
        ]);

        try {
            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'debit_note.classic');
            $template = $registry[$templateKey] ?? null;

            if (! $template) {
                return back()->with('error', "Template '{$templateKey}' not found.");
            }

            $type = $request->type ?: 'debit_note';

            if ($debitNote->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($debitNote->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($debitNote->file_path);
            }

            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapDebitNote($debitNote);
            $fileName = 'debit-note-'.uniqid().'.pdf';

            $result = $generator->generateAndStore(
                $debitNote->tenant,
                $templateKey,
                $payload,
                'debit-notes',
                $fileName
            );

            // Persist verification data
            $verificationService = app(\App\Services\Documents\DocumentVerificationService::class);
            $snapshot = $verificationService->computeSnapshot($payload);
            $documentHash = $verificationService->generateDocumentHash($snapshot);

            $debitNote->update([
                'type' => $type,
                'status' => DebitNote::STATUS_GENERATED,
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

            $debitNote->addToAuditTrail(
                'regenerated',
                'Debit note regenerated with new PDF',
                'Template: '.$templateKey
            );

            return redirect()
                ->route('debit-notes.show', $debitNote)
                ->with('success', 'Debit note regenerated successfully.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to regenerate debit note: '.$e->getMessage());
        }
    }

    /**
     * Download debit note PDF
     */
    public function downloadDebitNotePdf(DebitNote $debitNote)
    {
        Gate::authorize('download_debit_notes', $debitNote);

        try {
            // Check if PDF file exists
            if (! $debitNote->file_path || ! Storage::disk('public')->exists($debitNote->file_path)) {
                return back()->with('error', 'Debit note PDF file not found.');
            }

            // Log download activity
            if (method_exists($debitNote, 'addToAuditTrail')) {
                $debitNote->addToAuditTrail(
                    'downloaded',
                    'Debit note downloaded by '.Auth::user()->name
                );
            }

            return response()->download(
                Storage::disk('public')->path($debitNote->file_path),
                $debitNote->file_name ?? "debit-note-{$debitNote->note_number}.pdf"
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download certificate: '.$e->getMessage());
        }
    }

    /**
     * Preview debit note in browser
     */
    public function previewDebitNote(DebitNote $debitNote)
    {
        Gate::authorize('view_debit_notes', $debitNote);

        try {
            // Check if PDF file exists
            if (! $debitNote->file_path || ! Storage::disk('public')->exists($debitNote->file_path)) {
                return back()->with('error', 'Debit note PDF file not found.');
            }

            // Set headers for PDF preview in browser
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.($debitNote->file_name ?? "debit-note-{$debitNote->note_number}.pdf").'"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ];

            // Log preview activity
            if (method_exists($debitNote, 'addToAuditTrail')) {
                $debitNote->addToAuditTrail(
                    'previewed',
                    'Debit note previewed by '.Auth::user()->name
                );
            }

            return new Response(Storage::disk('public')->get($debitNote->file_path), 200, $headers);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to preview Debit note: '.$e->getMessage());
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
     * Render the debit note Blade view as inline HTML for iframe preview.
     */
    public function htmlPreview(Request $request, DebitNote $debitNote)
    {
        Gate::authorize('view_debit_notes', $debitNote);

        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'debit_note.classic');
        $template = $registry[$templateKey] ?? null;

        if ($template) {
            $mapper = app(\App\Services\Documents\FinancialNotePayloadMapper::class);
            $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

            $payload = $mapper->mapDebitNote($debitNote);

            try {
                $html = $generator->renderHtml(
                    $debitNote->tenant,
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

        return response()->view('debit-notes.pdf', compact('debitNote'));
    }

    /**
     * Generate and stream a PDF of the debit note using the Blade template.
     */
    public function downloadPdf(DebitNote $debitNote)
    {
        Gate::authorize('download_debit_notes', $debitNote);

        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('debit-notes.pdf', compact('debitNote'));

        return $pdf->download("debit-note-{$debitNote->note_number}.pdf");
    }
}
