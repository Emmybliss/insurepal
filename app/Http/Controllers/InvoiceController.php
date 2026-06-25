<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Policy;
use App\Models\TenantDefaultTemplate;
use App\Services\DocumentGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    protected DocumentGenerationService $documentService;

    public function __construct(DocumentGenerationService $documentService)
    {
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'due_date' => 'required|date',
            'currency' => 'required|string|size:3',
            'notes' => 'nullable|string',
            'billing_address' => 'required|array',
            'shipping_address' => 'nullable|array',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Calculate totals from items
            $items = collect($validated['items'])->map(function ($item) {
                $subtotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $subtotal * ($item['tax_rate'] ?? 0) / 100;
                $discountAmount = $subtotal * ($item['discount_rate'] ?? 0) / 100;
                $total = $subtotal + $taxAmount - $discountAmount;

                return [
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $taxAmount,
                    'discount_rate' => $item['discount_rate'] ?? 0,
                    'discount_amount' => $discountAmount,
                    'total' => $total,
                ];
            });
            // Generate Debit Note Number
            $lastInvoice = Invoice::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
            $lastNumber = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -6)) : 0;
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);

            $lastSequence = Invoice::withTrashed()->where('tenant_id', Auth::user()->tenant_id)->latest('id')->first();
            $sequenceNumber = $lastSequence ? $lastSequence->sequence_number + 1 : 1;
            $invoice = Invoice::create([
                'invoice_number' => $newNumber,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => Auth::user()->tenant_id,
                'customer_id' => $validated['customer_id'],
                'policy_id' => $validated['policy_id'] ?? null,
                'user_id' => Auth::id(), // Assuming the authenticated user is the creator
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'notes' => $validated['notes'],
                'billing_address' => $validated['billing_address'],
                'shipping_address' => $validated['shipping_address'],
                'subtotal' => $items->sum('total'),
                'tax_amount' => $items->sum('tax_amount'),
                'discount_amount' => $items->sum('discount_amount'),
                'total_amount' => $items->sum('total'),
                'status' => 'draft',
            ]);

            // Create invoice items
            $invoice->items()->createMany($items->toArray());

            DB::commit();

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Invoice created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

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

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->back()
                ->with('error', 'Only draft invoices can be edited.');
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'due_date' => 'required|date',
            'currency' => 'required|string|size:3',
            'notes' => 'nullable|string',
            'billing_address' => 'required|array',
            'shipping_address' => 'nullable|array',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:invoice_items,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Calculate totals and prepare items
            $items = collect($validated['items'])->map(function ($item) {
                $subtotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $subtotal * ($item['tax_rate'] ?? 0) / 100;
                $discountAmount = $subtotal * ($item['discount_rate'] ?? 0) / 100;
                $total = $subtotal + $taxAmount - $discountAmount;

                return [
                    'id' => $item['id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $taxAmount,
                    'discount_rate' => $item['discount_rate'] ?? 0,
                    'discount_amount' => $discountAmount,
                    'total' => $total,
                ];
            });

            // Update invoice
            $invoice->update([
                'customer_id' => $validated['customer_id'],
                'policy_id' => $validated['policy_id'] ?? null,
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'notes' => $validated['notes'],
                'billing_address' => $validated['billing_address'],
                'shipping_address' => $validated['shipping_address'],
                'subtotal' => $items->sum('total'),
                'tax_amount' => $items->sum('tax_amount'),
                'discount_amount' => $items->sum('discount_amount'),
                'total_amount' => $items->sum('total'),
            ]);

            // Update or create items
            $existingItemIds = $invoice->items->pluck('id')->toArray();
            $updatedItemIds = $items->pluck('id')->filter()->toArray();

            // Delete removed items
            $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
            if (! empty($itemsToDelete)) {
                InvoiceItem::whereIn('id', $itemsToDelete)->delete();
            }

            // Update or create items
            foreach ($items as $item) {
                if (isset($item['id'])) {
                    InvoiceItem::find($item['id'])->update($item);
                } else {
                    $invoice->items()->create($item);
                }
            }

            DB::commit();

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Invoice updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

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
        ]);

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
        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'invoice.classic');
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            // Get first invoice template from config
            $invoiceTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'invoice');
            $templateKey = array_key_first($invoiceTemplates);
            $template = $templateKey ? $registry[$templateKey] : null;
        }

        if (! $template) {
            return 'No invoice template found.';
        }

        $html = $this->documentService->generateInvoiceHtml($invoice, $template, true);

        return response($html);
    }
}
