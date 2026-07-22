<?php

namespace App\Http\Controllers;

use App\Http\Requests\DebitNoteRequest;
use App\Http\Requests\Shared\GenerateNoteRequest;
use App\Http\Requests\Shared\MarkNotePaidRequest;
use App\Http\Requests\Shared\StoreNoteFromPolicyRequest;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\PolicyClass;
use App\Models\PolicyType;
use App\Services\DebitNoteService;
use App\Services\DocumentGenerationService;
use App\Services\Finance\DebitNoteListingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DebitNoteController extends Controller
{
    protected string $type = 'debit';

    protected string $routeNamePrefix = 'debit-notes';

    public function __construct(
        protected DebitNoteService $service,
        protected DocumentGenerationService $documentService,
        protected DebitNoteListingService $listingService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('debit-notes/Index', [
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

        return Inertia::render('debit-notes/Create', [
            'lastDebitNote' => $data['lastNoteNumber'],
            'customers' => $data['customers'],
            'policies' => $request->filled('customer_id')
                ? Policy::where('customer_id', $request->customer_id)->with(['policyProduct', 'policyClass', 'policyType'])->get()
                : Policy::where('tenant_id', $user->tenant_id)->with(['policyProduct', 'policyClass', 'policyType'])->get(),
            'selectedCustomer' => $request->customer_id,
            'type' => $this->type,
            'tenant_id' => $user->tenant_id,
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => PolicyClass::select('id', 'name', 'policy_type_id')->get(),
        ]);
    }

    public function store(DebitNoteRequest $request)
    {
        try {
            $user = $request->user();
            $note = $this->service->create($request->validated(), $user->tenant_id, $user->id);

            return redirect()->route($this->routeNamePrefix.'.show', $note)
                ->with('success', 'Debit note created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating debit note: '.$e->getMessage());

            return back()->with('error', 'An error occurred while creating the debit note: '.$e->getMessage());
        }
    }

    public function storeFromPolicy(StoreNoteFromPolicyRequest $request, Policy $policy)
    {
        $this->service->createFromPolicy($policy, $request->validated(), $request->user()->id);

        return redirect()->route('policy-management.show', $policy)
            ->with('success', 'Debit Note created successfully.');
    }

    public function show(DebitNote $debitNote)
    {
        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $templates = array_filter(
            config('document-templates.templates', []),
            fn ($t) => ($t['type'] ?? '') === 'debit_note'
        );

        return Inertia::render('debit-notes/Show', [
            'note' => $debitNote,
            'templates' => $templates,
        ]);
    }

    public function edit(DebitNote $debitNote)
    {
        if (! $this->service->canModify($debitNote)) {
            return back()->with('error', 'Only draft notes can be edited.');
        }

        $debitNote->load(['customer', 'policy']);

        return Inertia::render('debit-notes/Edit', [
            'note' => $debitNote,
            ...$this->service->getEditData($debitNote),
        ]);
    }

    public function update(DebitNoteRequest $request, DebitNote $debitNote)
    {
        try {
            $this->service->update($debitNote, $request->validated());

            return redirect()->route($this->routeNamePrefix.'.show', $debitNote)
                ->with('success', 'Debit note updated successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function destroy(DebitNote $debitNote)
    {
        try {
            $this->service->delete($debitNote);

            return redirect()->route($this->routeNamePrefix.'.index')
                ->with('success', 'Debit note deleted successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function issueDebitNote(DebitNote $debitNote)
    {
        try {
            $this->service->issue($debitNote);

            return back()->with('success', 'Debit note issued successfully.');
        } catch (\Throwable $e) {
            Log::error('Error issuing debit note', ['debit_note_id' => $debitNote->id, 'error' => $e->getMessage()]);

            return back()->with('error', $e->getMessage() ?: 'An error occurred while issuing the debit note.');
        }
    }

    public function markDebitNoteAsPaid(MarkNotePaidRequest $request, DebitNote $debitNote)
    {
        try {
            $this->service->markAsPaid($debitNote, $request->user(), $request->validated());

            return back()->with('success', 'Debit note marked as paid successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        } catch (\Throwable $th) {
            report($th);

            return back()->with('error', 'Failed to mark debit note as paid.');
        }
    }

    public function cancel(DebitNote $debitNote)
    {
        try {
            $this->service->cancel($debitNote, null, request()->user()->id);

            return back()->with('success', 'Debit note cancelled successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function getDebitNoteGenerationOptions(Request $request, DebitNote $debitNote)
    {
        $options = $this->service->getGenerationOptions($debitNote);

        return Inertia::render('debit-notes/GenerateDebitNote', [
            'debitNote' => $debitNote->load(['customer', 'policy.policyProduct', 'policy.policyType', 'policy.policyClass', 'createdBy', 'tenant']),
            'defaultTemplateKey' => $options['defaultTemplateKey'],
            'defaultTemplate' => $options['defaultTemplate'],
            'existing_debit_notes' => $options['existingDebitNotes'],
            'available_types' => DebitNote::getAvailableTypes(),
            'regenerate_debit_note_id' => $request->get('regenerate_debit_note_id'),
            'qrBarcodeData' => $options['qrBarcodeData'],
        ]);
    }

    public function generateDebitNote(GenerateNoteRequest $request, DebitNote $debitNote)
    {
        try {
            $this->service->generate($debitNote, $request->input('template_key'), $request->input('type', 'standard'));

            return redirect()->route('debit-notes.show', $debitNote)
                ->with('success', 'Debit note generated and saved successfully as PDF.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to generate debit note: '.$e->getMessage());
        }
    }

    public function regenerateDebitNote(GenerateNoteRequest $request, DebitNote $debitNote)
    {
        set_time_limit(120);

        try {
            $this->service->regenerate($debitNote, $request->input('template_key'), $request->input('type', 'debit_note'));

            return redirect()->route('debit-notes.show', $debitNote)
                ->with('success', 'Debit note regenerated successfully.');
        } catch (\Exception $e) {
            report($e);

            return back()->with('error', 'Failed to regenerate debit note: '.$e->getMessage());
        }
    }

    public function downloadDebitNotePdf(DebitNote $debitNote)
    {
        try {
            $filePath = $this->service->download($debitNote);

            if (! $filePath) {
                return back()->with('error', 'Debit note PDF file not found.');
            }

            return response()->download(
                \Illuminate\Support\Facades\Storage::disk('public')->path($filePath),
                $debitNote->file_name ?? "debit-note-{$debitNote->note_number}.pdf"
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download certificate: '.$e->getMessage());
        }
    }

    public function previewDebitNote(DebitNote $debitNote)
    {
        try {
            $filePath = $this->service->preview($debitNote);

            if (! $filePath) {
                return back()->with('error', 'Debit note PDF file not found.');
            }

            return response()->file(
                \Illuminate\Support\Facades\Storage::disk('public')->path($filePath),
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.($debitNote->file_name ?? "debit-note-{$debitNote->note_number}.pdf").'"',
                ]
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to preview Debit note: '.$e->getMessage());
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

    public function htmlPreview(Request $request, DebitNote $debitNote)
    {
        $templateKey = $request->input('template_key', 'debit_note.classic');
        $pdfContent = $this->documentService->generateDebitNotePdf($debitNote, $templateKey);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="debit-note-preview.pdf"',
        ]);
    }

    public function downloadPdf(DebitNote $debitNote)
    {
        $pdfContent = $this->service->generatePdfDirect($debitNote);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="debit-note-'.$debitNote->note_number.'.pdf"',
        ]);
    }
}
