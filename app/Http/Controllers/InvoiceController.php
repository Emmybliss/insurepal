<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\TenantDefaultTemplate;
use App\Services\DocumentGenerationService;
use App\Services\Finance\GenerateInvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    protected DocumentGenerationService $documentService;

    public function __construct(
        DocumentGenerationService $documentService,
        private GenerateInvoiceService $generateInvoiceService,
    ) {
        $this->documentService = $documentService;
    }

    public function index()
    {
        $invoices = Invoice::with(['customer', 'policy', 'items'])
            ->where('tenant_id', Auth::user()->tenant_id)
            ->latest()
            ->paginate(10);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
        ]);
    }

    public function create(Request $request)
    {
        // Get Last Invoice
        $lastInvoice = Invoice::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
        //  Generate Invoice Number
        $lastNumber = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -6)) : 0;
        $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)->get();
        $policies = collect();

        if ($request->filled('customer_id')) {
            $policies = Policy::where('customer_id', $request->customer_id)
                ->with('policyProduct')
                ->get();
        }

        return Inertia::render('Invoices/Create', [
            'customers' => $customers,
            'policies' => $policies,
            'lastInvoiceNumber' => $newNumber,
            'queryParams' => $request->all(),
        ]);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $validated = $request->validated();

        try {
            $invoice = $this->generateInvoiceService->generate(
                $validated,
                Auth::user(),
            );

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Invoice created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create invoice. '.$e->getMessage());
        }
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['customer', 'items', 'policy', 'user', 'tenant']);

        $registry = config('document-templates.templates', []);
        $templates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'invoice');

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'templates' => $templates,
        ]);
    }

    public function edit(Invoice $invoice)
    {
        $invoice->load(['customer', 'policy', 'items']);
        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)->get();
        $policies = Policy::where('tenant_id', Auth::user()->tenant_id)->get();

        return Inertia::render('Invoices/Edit', [
            'invoice' => $invoice,
            'customers' => $customers,
            'policies' => $policies,
        ]);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->back()
                ->with('error', 'Only draft invoices can be edited.');
        }

        $validated = $request->validated();

        try {
            $this->generateInvoiceService->updateInvoice($invoice, $validated);

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Invoice updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update invoice. '.$e->getMessage());
        }
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->back()
                ->with('error', 'Only draft invoices can be deleted.');
        }

        $invoice->delete();

        return redirect()->route('invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }

    public function markAsSent(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->back()
                ->with('error', 'Only draft invoices can be marked as sent.');
        }

        $invoice->update(['status' => 'sent']);

        return redirect()->back()
            ->with('success', 'Invoice marked as sent.');
    }

    public function markAsPaid(Invoice $invoice)
    {
        if (! in_array($invoice->status, ['sent', 'partially_paid'])) {
            return redirect()->back()
                ->with('error', 'Only sent or partially paid invoices can be marked as paid.');
        }

        $invoice->update(['status' => 'paid']);

        return redirect()->back()
            ->with('success', 'Invoice marked as paid.');
    }

    public function downloadPdf(Request $request, Invoice $invoice)
    {
        try {
            $invoice->load(['customer', 'items', 'tenant', 'policy']);

            $templateKey = $request->input('template_key', 'invoice.classic');
            $registry = config('document-templates.templates', []);
            $template = $registry[$templateKey] ?? null;

            $pdfContent = $this->documentService->generateInvoicePdf($invoice, $template);

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="invoice-'.$invoice->invoice_number.'.pdf"',
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to generate PDF: '.$e->getMessage());
        }
    }

    public function getInvoiceGenerationOptions(Request $request, Invoice $invoice)
    {
        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($invoice->tenant_id, 'invoice')
            ?? 'invoice.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        return Inertia::render('Invoices/GenerateInvoice', [
            'invoice' => $invoice->load(['customer', 'policy', 'items', 'tenant']),
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
        ]);
    }

    public function generateInvoice(Request $request, Invoice $invoice)
    {
        $request->validate([
            'template_key' => 'required|string',
        ]); // single field — leave inline

        try {
            DB::beginTransaction();

            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'invoice.classic');
            $template = $registry[$templateKey] ?? null;

            if (! $template) {
                throw new \Exception("Template '{$templateKey}' not found.");
            }

            // Generate PDF content using the service
            $pdfContent = $this->documentService->generateInvoicePdf($invoice, $template);

            // Define storage path
            $fileName = 'invoice_'.$invoice->id.'_'.time().'.pdf';
            $filePath = 'invoices/'.$fileName;

            // Store file
            \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $pdfContent);

            // Update invoice with file path and template key
            $invoice->update([
                'file_path' => $filePath,
                'status' => 'sent',
            ]);

            DB::commit();

            return redirect()->route('invoices.show', $invoice->id)
                ->with('success', 'Invoice generated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Invoice generation failed: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to generate invoice: '.$e->getMessage());
        }
    }

    public function previewInvoice(Invoice $invoice)
    {
        if (! $invoice->file_path || ! \Illuminate\Support\Facades\Storage::disk('public')->exists($invoice->file_path)) {
            return redirect()->back()->with('error', 'Invoice file not found.');
        }

        return response()->file(storage_path('app/public/'.$invoice->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="invoice-'.$invoice->invoice_number.'.pdf"',
        ]);
    }

    public function htmlPreview(Request $request, Invoice $invoice)
    {
        $templateKey = $request->input('template_key', 'invoice.classic');
        $pdfContent = $this->documentService->generateInvoicePdf($invoice, $templateKey);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="invoice-preview.pdf"',
        ]);
    }
}
