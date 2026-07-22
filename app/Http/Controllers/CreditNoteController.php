<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreditNoteRequest;
use App\Http\Requests\Shared\GenerateNoteRequest;
use App\Http\Requests\Shared\MarkNotePaidRequest;
use App\Http\Requests\Shared\StoreNoteFromPolicyRequest;
use App\Models\CreditNote;
use App\Models\Policy;
use App\Services\CreditNoteService;
use App\Services\Finance\CreditNoteListingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CreditNoteController extends Controller
{
    protected string $type = 'credit';

    protected string $routeNamePrefix = 'credit-notes';

    public function __construct(
        protected CreditNoteService $service,
        protected CreditNoteListingService $listingService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('credit-notes/Index', [
            'notes' => $this->listingService->list($user, $request->only(['search', 'status', 'customer_id'])),
            'customers' => $this->listingService->getCreateData($user)['customers'],
            'filters' => $request->only(['search', 'status', 'customer_id']),
            'stats' => $this->listingService->getStats($user),
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();
        $data = $this->listingService->getCreateData($user);

        return Inertia::render('credit-notes/Create', [
            'lastCreditNote' => $data['lastNoteNumber'],
            'customers' => $data['customers'],
            'policies' => $request->filled('customer_id')
                ? Policy::where('customer_id', $request->customer_id)->with('policyProduct')->get()
                : collect(),
            'debit_notes' => \App\Models\DebitNote::with(['customer', 'policy.policyProduct', 'policy.policyClass', 'policy.policyType'])->where('tenant_id', $user->tenant_id)->where('status', '!=', 'cancelled')->get(),
            'selectedCustomer' => $request->customer_id,
            'selectedDebitNote' => $request->debit_note_id,
            'type' => $this->type,
            'tenant_id' => $user->tenant_id,
        ]);
    }

    public function store(CreditNoteRequest $request)
    {
        try {
            $user = $request->user();
            $note = $this->service->create($request->validated(), $user->tenant_id, $user->id);

            return redirect()->route($this->routeNamePrefix.'.show', $note)
                ->with('success', 'Credit note created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating credit note: '.$e->getMessage());

            return back()->with('error', 'An error occurred while creating the credit note: '.$e->getMessage());
        }
    }

    public function storeFromPolicy(StoreNoteFromPolicyRequest $request, Policy $policy)
    {
        $this->service->createCreditNoteFromPolicy($policy, $request->user(), $request->validated());

        return redirect()->route('policy-management.show', $policy)
            ->with('success', 'Credit note created successfully.');
    }

    public function show(CreditNote $creditNote)
    {
        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $templates = array_filter(
            config('document-templates.templates', []),
            fn ($t) => ($t['type'] ?? '') === 'credit_note'
        );

        return Inertia::render('credit-notes/Show', [
            'note' => $creditNote,
            'templates' => $templates,
        ]);
    }

    public function edit(CreditNote $creditNote)
    {
        if (! $this->service->canModify($creditNote)) {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $creditNote->load(['customer', 'policy']);

        return Inertia::render('credit-notes/Edit', [
            'note' => $creditNote,
            ...$this->service->getEditData($creditNote),
        ]);
    }

    public function update(CreditNoteRequest $request, CreditNote $creditNote)
    {
        try {
            $this->service->update($creditNote, $request->validated());

            return redirect()->route($this->routeNamePrefix.'.show', $creditNote)
                ->with('success', 'Credit note updated successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function destroy(CreditNote $creditNote)
    {
        try {
            $this->service->delete($creditNote);

            return redirect()->route($this->routeNamePrefix.'.index')
                ->with('success', 'Credit note deleted successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function issueCreditNote(CreditNote $creditNote)
    {
        try {
            $this->service->issue($creditNote);

            return back()->with('success', 'Credit note issued successfully.');
        } catch (\Throwable $e) {
            Log::error('Error issuing credit note', ['credit_note_id' => $creditNote->id, 'error' => $e->getMessage()]);

            return back()->with('error', $e->getMessage() ?: 'An error occurred while issuing the credit note.');
        }
    }

    public function markCreditNoteAsPaid(MarkNotePaidRequest $request, CreditNote $creditNote)
    {
        try {
            $this->service->markAsPaid($creditNote, $request->user(), $request->validated());

            return back()->with('success', 'Credit note marked as paid successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        } catch (\Throwable $th) {
            report($th);

            return back()->with('error', 'Failed to mark credit note as paid.');
        }
    }

    public function cancel(CreditNote $creditNote)
    {
        try {
            $this->service->cancel($creditNote);

            return back()->with('success', 'Credit note cancelled successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function getCreditNoteGenerationOptions(Request $request, CreditNote $creditNote)
    {
        $options = $this->service->getGenerationOptions($creditNote);

        return Inertia::render('credit-notes/GenerateCreditNote', [
            'creditNote' => $creditNote->load(['customer', 'policy.policyProduct', 'policy.policyType', 'policy.policyClass', 'createdBy', 'tenant']),
            'defaultTemplateKey' => $options['defaultTemplateKey'],
            'defaultTemplate' => $options['defaultTemplate'],
            'existing_credit_notes' => $options['existingCreditNotes'],
            'available_types' => CreditNote::getAvailableTypes(),
            'regenerate_credit_note_id' => $request->get('regenerate_credit_note_id'),
            'qrBarcodeData' => $options['qrBarcodeData'],
        ]);
    }

    public function generateCreditNote(GenerateNoteRequest $request, CreditNote $creditNote)
    {
        try {
            $this->service->generate($creditNote, $request->input('template_key'), $request->input('type', 'standard'));

            return redirect()->route('credit-notes.show', $creditNote)
                ->with('success', 'Credit note generated and saved successfully as PDF.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to generate credit note: '.$e->getMessage());
        }
    }

    public function regenerateCreditNote(GenerateNoteRequest $request, CreditNote $creditNote)
    {
        set_time_limit(120);

        try {
            $this->service->regenerate($creditNote, $request->input('template_key'), $request->input('type', 'credit_note'));

            return redirect()->route('credit-notes.show', $creditNote)
                ->with('success', 'Credit note regenerated successfully.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to regenerate credit note: '.$e->getMessage());
        }
    }

    public function downloadCreditNotePdf(CreditNote $creditNote)
    {
        try {
            $filePath = $this->service->download($creditNote);

            if (! $filePath) {
                return back()->with('error', 'Credit note PDF file not found.');
            }

            return response()->download(
                \Illuminate\Support\Facades\Storage::disk('public')->path($filePath),
                $creditNote->file_name ?? "credit-note-{$creditNote->note_number}.pdf"
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download certificate: '.$e->getMessage());
        }
    }

    public function previewCreditNote(CreditNote $creditNote)
    {
        try {
            $filePath = $this->service->preview($creditNote);

            if (! $filePath) {
                return back()->with('error', 'Credit note PDF file not found.');
            }

            return response()->file(
                \Illuminate\Support\Facades\Storage::disk('public')->path($filePath),
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.($creditNote->file_name ?? "credit-note-{$creditNote->note_number}.pdf").'"',
                ]
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to preview Credit note: '.$e->getMessage());
        }
    }

    public function getPoliciesByCustomer(Request $request)
    {
        return response()->json($this->service->getPoliciesByCustomer($request));
    }

    public function bulkAction(Request $request)
    {
        $processed = $this->service->bulkAction($request);

        return back()->with('success', ucfirst($request->action)." action completed for {$processed} notes.");
    }

    public function htmlPreview(Request $request, CreditNote $creditNote)
    {
        $templateKey = $request->input('template_key', 'credit_note.classic');
        $pdfContent = app(\App\Services\DocumentGenerationService::class)->generateCreditNotePdf($creditNote, $templateKey);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="credit-note-preview.pdf"',
        ]);
    }

    public function downloadPdf(CreditNote $creditNote)
    {
        $pdfContent = $this->service->generatePdfDirect($creditNote);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="credit-note-'.$creditNote->note_number.'.pdf"',
        ]);
    }
}
